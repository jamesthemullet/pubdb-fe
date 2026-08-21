"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import { useContributions } from "@/hooks/useContributions";
import { buildAuthHeaders } from "@/lib/auth";
import { getErrorMessage, getResponseMessage, isHttpErrorObject } from "@/lib/errors";
import styles from "./dashboard.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiKey = {
  id?: string;
  name: string;
  tier: string;
  keyPrefix: string;
  isActive: boolean;
  keyStatus?: string;
  status?: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
};

type Subscription = {
  tier: string;
  limits: {
    requestsPerHour: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  remaining: { hour: number; day: number; month: number };
  resetTimes: { hour: string; day: string; month: string };
  features: { allowLocationSearch: boolean; allowStats: boolean };
};

type GeneratedApiKeyResponse = {
  name?: string;
  keyPrefix?: string;
  tier?: string;
  keyStatus?: string;
  permissions?: string[];
  key?: string;
};

type TopEndpoint = { method: string; path: string; count: number };

type UsageRange = "24h" | "7d" | "30d" | "90d";

type UsagePoint = { timestamp: string; count: number };

type UsageSeriesResponse = {
  range: UsageRange;
  bucket: "hour" | "day";
  series: UsagePoint[];
};

type DashboardData = {
  user: {
    name: string;
    username: string;
    email: string;
    approved: boolean;
    emailVerified: boolean;
  };
  apiKeys: ApiKey[];
  subscription?: Subscription;
  summary: { totalApiKeys: number; totalUsage: number };
  topEndpoints?: TopEndpoint[];
};

const RANGE_LABELS: Record<UsageRange, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
};

const TIER_KEY_LIMITS: Record<string, number> = {
  HOBBY: 1,
  DEVELOPER: 3,
  BUSINESS: 10,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  for (const step of [1, 2, 5, 10]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}

function fmtCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${value}`;
}

function fmtBucketLabel(iso: string | undefined, bucket: "hour" | "day"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (bucket === "hour") {
    return d.toLocaleTimeString(undefined, { hour: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UsageBarChart({ data }: { data: UsageSeriesResponse }) {
  const W = 900,
    H = 180,
    ML = 36,
    MT = 10,
    MB = 28;
  const cW = W - ML,
    cH = H - MT - MB;
  const points = data.series;
  const n = points.length;
  const niceMax = niceCeil(Math.max(1, ...points.map((p) => p.count)));
  const slotW = cW / Math.max(n, 1);
  const bW = Math.max(slotW * 0.72, 3);
  const gX = (slotW - bW) / 2;

  const bX = (i: number) => ML + i * slotW + gX;
  const bH = (v: number) => (v / niceMax) * cH;
  const bY = (v: number) => MT + cH - bH(v);
  const yPos = (v: number) => MT + cH - (v / niceMax) * cH;

  const yLabels = [1, 2 / 3, 1 / 3, 0].map((f) => ({
    v: Math.round(niceMax * f),
    t: fmtCount(Math.round(niceMax * f)),
  }));

  const xLabelCount = Math.min(4, n);
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / Math.max(xLabelCount - 1, 1)) * (n - 1));
    return { idx, t: fmtBucketLabel(points[idx]?.timestamp, data.bucket) };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.barChartSvg} aria-hidden="true">
      {yLabels.map(({ v, t }) => (
        <g key={v}>
          <line x1={ML} y1={yPos(v)} x2={W} y2={yPos(v)} stroke="#e8e8e4" strokeWidth="1" />
          <text x={ML - 6} y={yPos(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
            {t}
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <rect
          key={p.timestamp}
          x={bX(i)}
          y={bY(p.count)}
          width={bW}
          height={Math.max(bH(p.count), p.count > 0 ? 1 : 0)}
          fill={i === n - 1 ? "#2563eb" : "#555555"}
          rx="2"
        />
      ))}
      {xLabels.map(({ idx, t }) => (
        <text key={idx} x={bX(idx) + bW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">
          {t}
        </text>
      ))}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const Dashboard = (): React.JSX.Element | null => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const { contributions, contributionsLoading, contributionsError } =
    useContributions();
  const [expandedEdits, setExpandedEdits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [forgotKeyLoading, setForgotKeyLoading] = useState(false);
  const [forgotKeyMessage, setForgotKeyMessage] = useState<string | null>(null);
  const [forgotKeyError, setForgotKeyError] = useState<string | null>(null);
  const [forgotKeyTarget, setForgotKeyTarget] = useState<string | null>(null);
  const [forgotKeyDetails, setForgotKeyDetails] =
    useState<GeneratedApiKeyResponse | null>(null);
  const [showForgotKeyModal, setShowForgotKeyModal] = useState(false);
  const [forgotKeyCopyStatus, setForgotKeyCopyStatus] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [createKeyLoading, setCreateKeyLoading] = useState(false);
  const [createKeyError, setCreateKeyError] = useState<string | null>(null);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [addKeyName, setAddKeyName] = useState("");
  const [addKeyLoading, setAddKeyLoading] = useState(false);
  const [addKeyError, setAddKeyError] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(
    null
  );
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<UsageRange>("30d");
  const [usageSeries, setUsageSeries] = useState<UsageSeriesResponse | null>(
    null
  );
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const forgotKeyModalRef = useRef<HTMLDivElement>(null);
  const forgotKeyModalTriggerRef = useRef<HTMLElement | null>(null);
  const cancelAuthChangedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (cancelAuthChangedTimeoutRef.current) {
        clearTimeout(cancelAuthChangedTimeoutRef.current);
      }
    };
  }, []);

  function toggleEditTypes(pubId: string): void {
    setExpandedEdits((prev) => {
      const next = new Set(prev);
      next.has(pubId) ? next.delete(pubId) : next.add(pubId);
      return next;
    });
  }

  useEffect(() => {
    async function fetchDashboard(token: string): Promise<void> {
      try {
        setError(null);
        const res = await fetch("/api/auth/dashboard", {
          headers: buildAuthHeaders(token),
        });
        if (!res.ok) {
          const errorData: unknown = await res.json();
          throw { response: res, data: errorData };
        }
        const dashboardRaw: unknown = await res.json();
        setDashboardData(dashboardRaw as DashboardData);
      } catch (err: unknown) {
        if (isHttpErrorObject(err)) {
          setError(
            err.data.message ||
              err.data.error ||
              `HTTP error! status: ${err.response.status}`
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard"
          );
        }
      } finally {
        setLoading(false);
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
    } else {
      setIsAuthenticated(true);
      fetchDashboard(token);
    }

    const handleAuthChange = () => {
      const t = localStorage.getItem("token");
      setIsAuthenticated(!!t);
      if (t) {
        fetchDashboard(t);
      } else {
        setLoading(false);
      }
    };
    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    async function fetchUsage(token: string, range: UsageRange): Promise<void> {
      try {
        setUsageError(null);
        setUsageLoading(true);
        const res = await fetch(`/api/auth/dashboard/usage?range=${range}`, {
          headers: buildAuthHeaders(token),
        });
        if (!res.ok) {
          const errorData: unknown = await res.json().catch(() => ({}));
          throw { response: res, data: errorData };
        }
        const data = (await res.json()) as Partial<UsageSeriesResponse> | null;
        setUsageSeries({
          range: data?.range ?? range,
          bucket: data?.bucket ?? "day",
          series: Array.isArray(data?.series) ? data.series : [],
        });
      } catch (err: unknown) {
        setUsageSeries(null);
        if (isHttpErrorObject(err)) {
          setUsageError(
            err.data.message ||
              err.data.error ||
              `HTTP error! status: ${err.response.status}`
          );
        } else {
          setUsageError(
            err instanceof Error ? err.message : "Failed to load request volume"
          );
        }
      } finally {
        setUsageLoading(false);
      }
    }

    function run(): void {
      const token = localStorage.getItem("token");
      if (!token) {
        setUsageLoading(false);
        setUsageSeries(null);
        return;
      }
      fetchUsage(token, chartRange);
    }

    run();
    window.addEventListener("authChanged", run);
    window.addEventListener("storage", run);
    return () => {
      window.removeEventListener("authChanged", run);
      window.removeEventListener("storage", run);
    };
  }, [chartRange]);

  async function handleCancelSubscription(): Promise<void> {
    if (
      !confirm(
        "Cancel subscription? This will stop automatic renewal — your subscription will remain active until the end of the current billing period."
      )
    )
      return;
    try {
      setCancelling(true);
      setCancelError(null);
      setCancelMessage(null);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({}),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      setCancelMessage(
        getResponseMessage(data) ||
          "Subscription cancelled. It will expire at the end of the current billing period."
      );
      cancelAuthChangedTimeoutRef.current = setTimeout(
        () => window.dispatchEvent(new Event("authChanged")),
        800
      );
    } catch (err: unknown) {
      setCancelError(getErrorMessage(err, "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  }

  async function handleForgotApiKey(id: string, keyPrefix: string): Promise<void> {
    try {
      setForgotKeyLoading(true);
      setForgotKeyError(null);
      setForgotKeyMessage(null);
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
      setForgotKeyTarget(id);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/auth/keys/${encodeURIComponent(id)}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({}),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      setForgotKeyMessage(
        getResponseMessage(data) ||
          "If this API key is eligible, instructions have been emailed to the account owner."
      );
      const raw = data as Record<string, unknown>;
      if (raw.apiKey && typeof raw.apiKey === "object") {
        const apiKey = raw.apiKey as GeneratedApiKeyResponse;
        setForgotKeyDetails({
          ...apiKey,
          keyPrefix: apiKey.keyPrefix || keyPrefix,
        });
        setShowForgotKeyModal(true);
        setForgotKeyCopyStatus("idle");
      }
    } catch (err: unknown) {
      setForgotKeyError(
        getErrorMessage(err, "Failed to request API key reminder")
      );
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
    } finally {
      setForgotKeyLoading(false);
    }
  }

  async function handleCopyNewApiKey(): Promise<void> {
    if (!forgotKeyDetails?.key) return;
    try {
      await navigator.clipboard.writeText(forgotKeyDetails.key);
      setForgotKeyCopyStatus("copied");
      setTimeout(() => setForgotKeyCopyStatus("idle"), 2000);
    } catch {
      setForgotKeyCopyStatus("error");
    }
  }

  function handleCloseForgotKeyModal() {
    setShowForgotKeyModal(false);
    setForgotKeyDetails(null);
    setForgotKeyCopyStatus("idle");
    forgotKeyModalTriggerRef.current?.focus();
  }

  async function handleCreateApiKey(): Promise<void> {
    try {
      setCreateKeyLoading(true);
      setCreateKeyError(null);
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments/subscribe-to-hobby", {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      const raw = data as Record<string, unknown>;
      const keyData: GeneratedApiKeyResponse = (raw.apiKey ?? raw) as GeneratedApiKeyResponse;
      setForgotKeyDetails(keyData);
      setShowForgotKeyModal(true);
      setForgotKeyCopyStatus("idle");
      const refreshRes = await fetch("/api/auth/dashboard", {
        headers: buildAuthHeaders(token),
      });
      if (refreshRes.ok) setDashboardData((await refreshRes.json()) as unknown as DashboardData);
    } catch (err: unknown) {
      setCreateKeyError(getErrorMessage(err, "Failed to create API key"));
    } finally {
      setCreateKeyLoading(false);
    }
  }

  function handleOpenAddKeyModal() {
    setAddKeyName("");
    setAddKeyError(null);
    setShowAddKeyModal(true);
  }

  function handleCloseAddKeyModal() {
    setShowAddKeyModal(false);
    setAddKeyError(null);
  }

  async function handleAddApiKey(): Promise<void> {
    try {
      setAddKeyLoading(true);
      setAddKeyError(null);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify(addKeyName.trim() ? { name: addKeyName.trim() } : {}),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      const raw = data as Record<string, unknown>;
      const keyData: GeneratedApiKeyResponse = (raw.apiKey ?? raw) as GeneratedApiKeyResponse;
      setShowAddKeyModal(false);
      setForgotKeyDetails(keyData);
      setShowForgotKeyModal(true);
      setForgotKeyCopyStatus("idle");
      const refreshRes = await fetch("/api/auth/dashboard", {
        headers: buildAuthHeaders(token),
      });
      if (refreshRes.ok) setDashboardData((await refreshRes.json()) as unknown as DashboardData);
    } catch (err: unknown) {
      setAddKeyError(getErrorMessage(err, "Failed to create API key"));
    } finally {
      setAddKeyLoading(false);
    }
  }

  async function handleRevokeApiKey(id: string, keyPrefix: string): Promise<void> {
    if (!confirm(`Revoke key ${keyPrefix}····? This can't be undone.`)) return;
    try {
      setRevokingKeyId(id);
      setRevokeError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/auth/keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      const refreshRes = await fetch("/api/auth/dashboard", {
        headers: buildAuthHeaders(token),
      });
      if (refreshRes.ok) setDashboardData((await refreshRes.json()) as unknown as DashboardData);
    } catch (err: unknown) {
      setRevokeError(getErrorMessage(err, "Failed to revoke API key"));
    } finally {
      setRevokingKeyId(null);
    }
  }

  useEffect(() => {
    if (showForgotKeyModal && forgotKeyDetails) {
      forgotKeyModalTriggerRef.current = document.activeElement as HTMLElement;
      const focusable = forgotKeyModalRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [showForgotKeyModal, forgotKeyDetails]);

  function handleForgotKeyModalKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      handleCloseForgotKeyModal();
      return;
    }
    if (e.key !== "Tab" || !forgotKeyModalRef.current) return;
    const els = Array.from(
      forgotKeyModalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = els[0],
      last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  const subscription = dashboardData?.subscription;
  const topEndpoints = dashboardData?.topEndpoints ?? [];
  const totalUsed = useMemo(
    () =>
      subscription
        ? subscription.limits.requestsPerMonth - subscription.remaining.month
        : 0,
    [subscription]
  );
  const totalLimit = subscription?.limits.requestsPerMonth ?? 0;
  const totalUsedPct = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  const activeKeyCount = useMemo(
    () =>
      dashboardData?.apiKeys.filter(
        (k) => k.keyStatus === "ACTIVE" || k.isActive
      ).length ?? 0,
    [dashboardData]
  );
  const accountTier = subscription?.tier;
  const keyLimit = accountTier ? TIER_KEY_LIMITS[accountTier] : undefined;
  const atKeyLimit =
    !!keyLimit && (dashboardData?.apiKeys.length ?? 0) >= keyLimit;
  const showNudge =
    !!subscription &&
    accountTier === "HOBBY" &&
    totalUsedPct >= 75 &&
    !nudgeDismissed;

  if (!isAuthenticated) {
    return <AuthGate context="API keys" />;
  }

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.loadingDot} />
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.errorText}>Error: {error}</span>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <>
      {/* ── Add-key modal ────────────────────────────────────────────────── */}
      {showAddKeyModal && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-key-modal-title"
          >
            <p className={styles.modalTitle} id="add-key-modal-title">
              Add a new API key
            </p>
            <p className={styles.modalDesc}>
              Give it a name to help you tell your keys apart. Leave blank to
              use the default name.
            </p>
            <input
              type="text"
              className={styles.btnOutline}
              style={{ width: "100%", marginBottom: "1rem" }}
              aria-label="API key name"
              placeholder="e.g. Staging key"
              value={addKeyName}
              onChange={(e) => setAddKeyName(e.target.value)}
              disabled={addKeyLoading}
            />
            {addKeyError && <p className={styles.inlineError}>{addKeyError}</p>}
            <div className={styles.modalFooter} style={{ gap: "0.5rem" }}>
              <button
                type="button"
                className={styles.btnOutline}
                onClick={handleCloseAddKeyModal}
                disabled={addKeyLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  void handleAddApiKey();
                }}
                disabled={addKeyLoading}
              >
                {addKeyLoading ? "Creating…" : "Create key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Forgot-key modal ─────────────────────────────────────────────── */}
      {forgotKeyDetails && showForgotKeyModal && (
        <div className={styles.modalOverlay}>
          <div
            ref={forgotKeyModalRef}
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-key-modal-title"
            onKeyDown={handleForgotKeyModalKeyDown}
          >
            <p className={styles.modalTitle} id="forgot-key-modal-title">
              New API key generated
            </p>
            <p className={styles.modalDesc}>
              This key is shown only once. Copy it now and store it securely.
            </p>
            <dl className={styles.modalFields}>
              <div>
                <dt>Name</dt>
                <dd>{forgotKeyDetails.name || "Untitled key"}</dd>
              </div>
              <div>
                <dt>Tier</dt>
                <dd>{forgotKeyDetails.tier || "—"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{forgotKeyDetails.keyStatus || "—"}</dd>
              </div>
              <div>
                <dt>Key prefix</dt>
                <dd>{forgotKeyDetails.keyPrefix || "—"}</dd>
              </div>
              {!!forgotKeyDetails.permissions?.length && (
                <div>
                  <dt>Permissions</dt>
                  <dd>{forgotKeyDetails.permissions.join(", ")}</dd>
                </div>
              )}
            </dl>
            {forgotKeyDetails.key && (
              <div className={styles.modalKeyBlock}>
                <p className={styles.modalKeyLabel}>API key</p>
                <pre className={styles.modalKeyPre}>{forgotKeyDetails.key}</pre>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleCopyNewApiKey}
                >
                  {forgotKeyCopyStatus === "copied"
                    ? "Copied!"
                    : forgotKeyCopyStatus === "error"
                    ? "Copy failed"
                    : "Copy API key"}
                </button>
              </div>
            )}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnOutline}
                onClick={handleCloseForgotKeyModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ─────────────────────────────────────────────────────────── */}
      <div className={styles.page}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>API keys &amp; usage</h1>
            <p className={styles.pageSubtitle}>
              Track request volume, manage keys, and review activity across your
              projects.
            </p>
          </div>
          <div className={styles.pageActions}>
            {dashboardData.apiKeys.length === 0 ? (
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={createKeyLoading}
                onClick={() => {
                  void handleCreateApiKey();
                }}
              >
                {createKeyLoading ? "Creating…" : "+ New key"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={atKeyLimit}
                title={
                  atKeyLimit
                    ? `Your ${accountTier} plan allows up to ${keyLimit} API keys. Delete an existing key or upgrade your plan to create another.`
                    : undefined
                }
                onClick={handleOpenAddKeyModal}
              >
                {atKeyLimit ? "Key limit reached" : "+ Add key"}
              </button>
            )}
            {createKeyError && (
              <p className={styles.inlineError}>{createKeyError}</p>
            )}
          </div>
        </div>

        {/* Account warnings */}
        {(!dashboardData.user.approved ||
          !dashboardData.user.emailVerified) && (
          <div className={styles.warningBanner}>
            {!dashboardData.user.approved && (
              <span className={styles.warningItem}>
                Account pending approval
              </span>
            )}
            {!dashboardData.user.emailVerified && (
              <span className={styles.warningItem}>Email not verified</span>
            )}
          </div>
        )}

        {/* Stat cards */}
        <div className={styles.statsRow}>
          {/* Requests */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className={styles.statIcon}
                >
                  <path
                    d="M1 9L4 5l3 3 4-6"
                    stroke="#6b7280"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                REQUESTS · 30D
              </span>
            </div>
            <div className={styles.statValue}>
              {subscription ? totalUsed.toLocaleString() : "—"}
              <span className={styles.statSuffix}>
                /{totalLimit > 0 ? `${Math.round(totalLimit / 1000)}k` : "—"}
              </span>
            </div>
            {/* TODO: show % vs prev period once API returns historical usage data */}
          </div>

          {/* Latency */}
          {/* TODO: Pubs returned stat card — show once API returns total pub records served */}
        </div>

        {/* Request volume chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Request volume</span>
            <span className={styles.chartPeriod}>{RANGE_LABELS[chartRange]}</span>
            <div className={styles.rangeButtons}>
              {(["24h", "7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={chartRange === r ? styles.rangeActive : styles.rangeBtn}
                  onClick={() => setChartRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {usageLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : usageError ? (
            <p className={styles.inlineError}>{usageError}</p>
          ) : usageSeries && usageSeries.series.length > 0 ? (
            <UsageBarChart data={usageSeries} />
          ) : (
            <p className={styles.muted}>No request data for this period.</p>
          )}
        </div>

        {/* Bottom row: keys + top endpoints */}
        <div className={styles.bottomRow}>
          {/* API keys panel */}
          <div className={styles.keysPanel}>
            <div className={styles.keysPanelHeader}>
              <div className={styles.keysPanelLeft}>
                <span className={styles.keysPanelTitle}>API keys</span>
                <span className={styles.activeCountBadge}>
                  {activeKeyCount} active
                </span>
              </div>
              {dashboardData.apiKeys.length === 0 ? (
                <button
                  type="button"
                  className={styles.btnOutline}
                  disabled={createKeyLoading}
                  onClick={() => {
                    void handleCreateApiKey();
                  }}
                >
                  {createKeyLoading ? "Creating…" : "+ New key"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnOutline}
                  disabled={atKeyLimit}
                  title={
                    atKeyLimit
                      ? `Your ${accountTier} plan allows up to ${keyLimit} API keys. Delete an existing key or upgrade your plan to create another.`
                      : undefined
                  }
                  onClick={handleOpenAddKeyModal}
                >
                  {atKeyLimit ? "Key limit reached" : "+ Add key"}
                </button>
              )}
            </div>

            {cancelError && (
              <p className={styles.inlineError}>
                Error cancelling subscription: {cancelError}
              </p>
            )}
            {cancelMessage && (
              <p className={styles.inlineSuccess}>{cancelMessage}</p>
            )}
            {revokeError && (
              <p className={styles.inlineError}>{revokeError}</p>
            )}

            {dashboardData.apiKeys.length === 0 ? (
              <div className={styles.emptyKeys}>
                <p>No API keys yet.</p>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={createKeyLoading}
                  onClick={() => {
                    void handleCreateApiKey();
                  }}
                >
                  {createKeyLoading ? "Creating…" : "Create one to get started"}
                </button>
                {createKeyError && (
                  <p className={styles.inlineError}>{createKeyError}</p>
                )}
              </div>
            ) : (
              dashboardData.apiKeys.map((key) => {
                const identityKey = key.id ?? key.keyPrefix;
                const isMenuOpen = openMenu === identityKey;
                const isForgotLoading =
                  forgotKeyLoading && forgotKeyTarget === identityKey;

                return (
                  <div key={identityKey} className={styles.keyCard}>
                    <div className={styles.keyRow}>
                      <div className={styles.keyLeft}>
                        <span className={styles.keyName}>{key.name}</span>
                        <div className={styles.keyMeta}>
                          <code className={styles.keyPrefix}>
                            {key.keyPrefix} ····
                          </code>
                          <span className={styles.keyLastUsed}>
                            · last used {fmtRelative(key.lastUsed)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.btnOutline}
                          disabled={isForgotLoading || !key.id}
                          title={key.id ? undefined : "This key can't be regenerated from here — contact support."}
                          onClick={() => {
                            if (!key.id) return;
                            void handleForgotApiKey(key.id, key.keyPrefix);
                          }}
                        >
                          {isForgotLoading
                            ? "Regenerating…"
                            : "Regenerate API key"}
                        </button>
                        {forgotKeyTarget === identityKey && (
                          <>
                            {forgotKeyError && (
                              <p className={styles.inlineError}>
                                {forgotKeyError}
                              </p>
                            )}
                            {forgotKeyMessage && !showForgotKeyModal && (
                              <p className={styles.inlineSuccess}>
                                {forgotKeyMessage}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className={styles.keyRight}>
                        <span
                          className={`${styles.tierBadge} ${
                            key.tier === "HOBBY"
                              ? styles.tierHobby
                              : styles.tierDev
                          }`}
                        >
                          {key.tier}
                        </span>
                        <div className={styles.keyUsageGroup}>
                          <span className={styles.usageText}>
                            {key.usageCount.toLocaleString()} requests all-time
                          </span>
                        </div>
                        <div className={styles.keyMenuWrap}>
                          <button
                            type="button"
                            className={styles.menuDotBtn}
                            aria-label={`More options for ${key.name}`}
                            onClick={() =>
                              setOpenMenu(isMenuOpen ? null : identityKey)
                            }
                          >
                            •••
                          </button>
                          {isMenuOpen && key.keyStatus === "ACTIVE" && (
                            <div className={styles.menuDropdown}>
                              {key.tier !== "HOBBY" && (
                                <button
                                  type="button"
                                  className={styles.menuItem}
                                  disabled={isForgotLoading || !key.id}
                                  onClick={() => {
                                    if (!key.id) return;
                                    void handleForgotApiKey(key.id, key.keyPrefix);
                                    setOpenMenu(null);
                                  }}
                                >
                                  Forgot API key
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.menuItemDanger}
                                disabled={!key.id || revokingKeyId === key.id}
                                title={key.id ? undefined : "This key can't be revoked from here — contact support."}
                                onClick={() => {
                                  if (!key.id) return;
                                  void handleRevokeApiKey(key.id, key.keyPrefix);
                                  setOpenMenu(null);
                                }}
                              >
                                {revokingKeyId === key.id
                                  ? "Revoking…"
                                  : "Revoke key"}
                              </button>
                              {key.tier !== "HOBBY" && (
                                <button
                                  type="button"
                                  className={styles.menuItemDanger}
                                  disabled={cancelling}
                                  onClick={() => {
                                    void handleCancelSubscription();
                                    setOpenMenu(null);
                                  }}
                                >
                                  {cancelling
                                    ? "Cancelling…"
                                    : "Cancel subscription"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Top endpoints panel */}
          {topEndpoints.length > 0 && (
            <div className={styles.endpointsPanel}>
              <div className={styles.endpointsPanelHeader}>
                <span className={styles.endpointsTitle}>Top endpoints</span>
              </div>
              {topEndpoints.map((ep) => (
                <div
                  key={`${ep.method}-${ep.path}`}
                  className={styles.endpointRow}
                >
                  <div className={styles.endpointLabel}>
                    <span className={styles.endpointMethod}>{ep.method}</span>
                    <code className={styles.endpointPath}>{ep.path}</code>
                  </div>
                  <div className={styles.endpointBarWrap}>
                    <div
                      className={styles.endpointBar}
                      style={{
                        width: `${(ep.count / topEndpoints[0].count) * 100}%`,
                      }}
                    />
                  </div>
                  <span className={styles.endpointCount}>
                    {ep.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {showNudge && (
          <div className={styles.upgradeNudge}>
            <div className={styles.upgradeNudgeBody}>
              <p className={styles.upgradeNudgeHeading}>
                You&rsquo;ve used {Math.round(totalUsedPct)}% of your monthly
                requests
              </p>
              <p className={styles.upgradeNudgeDesc}>
                {(subscription?.remaining.month ?? 0).toLocaleString()} requests left
                this month. Upgrade to DEVELOPER to unlock significantly
                increased limits, location search and statistics.
              </p>
            </div>
            <div className={styles.upgradeNudgeActions}>
              <Link href="/#pricing" className={styles.upgradeNudgeCta}>
                Upgrade &rarr;
              </Link>
              <button
                type="button"
                className={styles.upgradeNudgeDismiss}
                aria-label="Dismiss upgrade prompt"
                onClick={() => setNudgeDismissed(true)}
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Contributions section */}
        {dashboardData.user.approved && (
          <div className={styles.contributionsSection}>
            <p className={styles.contributionsSectionTitle}>
              Your contributions
            </p>
            <p className={styles.contributionsPromo}>
              100+ contributions this month unlocks free Developer tier API
              access. Developer tier only · 2026 introductory offer.
            </p>
            {contributionsLoading && <p className={styles.muted}>Loading…</p>}
            {contributionsError && (
              <p className={styles.inlineError}>{contributionsError}</p>
            )}
            {!contributionsLoading && !contributionsError && contributions && (
              <>
                <p className={styles.muted}>
                  {contributions.totalAdded} pub
                  {contributions.totalAdded !== 1 ? "s" : ""} added
                </p>
                {contributions.recentPubs.length > 0 && (
                  <ul className={styles.recentPubList}>
                    {contributions.recentPubs.map((pub) => (
                      <li key={pub.id}>
                        <Link
                          href={`/pubs/${pub.id}`}
                          className={styles.recentPubLink}
                        >
                          {pub.name}
                        </Link>
                        <span className={styles.muted}> — {pub.city}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {contributions.editsByPub.length > 0 && (
                  <div className={styles.editsSection}>
                    <p
                      className={styles.contributionsSectionTitle}
                      style={{ marginTop: "1rem" }}
                    >
                      Recent edits
                    </p>
                    <ul className={styles.recentPubList}>
                      {contributions.editsByPub.map((entry) => (
                        <li key={entry.pubId} className={styles.editEntry}>
                          <div className={styles.editEntryRow}>
                            <div>
                              <Link
                                href={`/pubs/${entry.pubId}`}
                                className={styles.recentPubLink}
                              >
                                {entry.pubName}
                              </Link>
                              <span className={styles.muted}>
                                {" "}
                                — {entry.city}
                              </span>
                              <span className={styles.muted}>
                                {" "}
                                ({entry.editCount} edit
                                {entry.editCount !== 1 ? "s" : ""})
                              </span>
                            </div>
                            {entry.editTypes.length > 0 && (
                              <button
                                type="button"
                                className={styles.toggleButton}
                                onClick={() => toggleEditTypes(entry.pubId)}
                                aria-expanded={expandedEdits.has(entry.pubId)}
                                aria-controls={`edit-types-${entry.pubId}`}
                              >
                                {expandedEdits.has(entry.pubId)
                                  ? "Hide"
                                  : "Show fields"}
                              </button>
                            )}
                          </div>
                          {expandedEdits.has(entry.pubId) && (
                            <ul id={`edit-types-${entry.pubId}`} className={styles.editTypeList}>
                              {entry.editTypes.map((t) => (
                                <li key={t} className={styles.editTypePill}>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
