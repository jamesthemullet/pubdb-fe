"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useContributions } from "@/hooks/useContributions";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import { getErrorMessage, isHttpErrorObject } from "@/lib/errors";
import styles from "./dashboard.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiKey = {
  name: string;
  tier: string;
  keyPrefix: string;
  isActive: boolean;
  keyStatus?: string;
  status?: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  remaining: { hour: number; day: number; month: number };
  limits: { requestsPerHour: number; requestsPerDay: number; requestsPerMonth: number };
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

type DashboardData = {
  user: { name: string; username: string; email: string; approved: boolean; emailVerified: boolean };
  apiKeys: ApiKey[];
  summary: { totalApiKeys: number; totalUsage: number };
};

// ── Static display data (no analytics endpoint yet) ───────────────────────────

const CHART_BARS = [
  2200, 2550, 2300, 2850, 2650,
  2300, 1900, 1700, 1450, 1400,
  1600, 1800, 1700, 1650, 1800,
  2100, 2200, 2050, 1900, 1750,
  500,  600,  650,  580,  550,
  1100, 1200, 1290, 1380, 3200,
].map((v, i) => ({ id: `c${i}`, v }));

const SPARKLINE = {
  requests: [180,210,190,240,220,280,260,300,280,320,290,340,320,380,360,410,390,420,400,440],
  latency:  [42,40,38,41,37,39,36,38,35,37,34,38,36,39,37,38,36,37,35,38],
  error:    [3,4,2,5,3,6,4,3,5,4,3,5,4,6,5,4,5,4,5,4],
  pubs:     [300,320,340,360,350,370,380,360,370,380,370,385,380,390,385,390,385,392,388,389],
};

const TOP_ENDPOINTS = [
  { method: "GET",  path: "/v1/pubs",        count: 18922, pct: 100 },
  { method: "GET",  path: "/v1/pubs/:id",    count: 12041, pct: 64  },
  { method: "GET",  path: "/v1/pubs/search", count: 6391,  pct: 34  },
  { method: "GET",  path: "/v1/beers",       count: 2882,  pct: 15  },
  { method: "POST", path: "/v1/pubs",        count: 162,   pct: 1   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sparklinePoints(data: number[], w = 120, h = 32): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 2 - ((v - min) / range) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
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

function Sparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <svg width="120" height="32" aria-hidden="true" className={styles.sparklineSvg}>
      <polyline
        points={sparklinePoints(data)}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BarChart() {
  const W = 900, H = 180, ML = 36, MT = 10, MB = 28;
  const cW = W - ML, cH = H - MT - MB;
  const MAX = 3500;
  const n = CHART_BARS.length;
  const slotW = cW / n;
  const bW = Math.max(slotW * 0.72, 6);
  const gX = (slotW - bW) / 2;

  const bX = (i: number) => ML + i * slotW + gX;
  const bH = (v: number) => (Math.min(v, MAX) / MAX) * cH;
  const bY = (v: number) => MT + cH - bH(v);
  const yPos = (v: number) => MT + cH - (v / MAX) * cH;

  const yLabels = [{ v: 3000, t: "3k" }, { v: 2000, t: "2k" }, { v: 1000, t: "1k" }, { v: 0, t: "0" }];
  const xLabels = [{ idx: 0, t: "Apr 5" }, { idx: 10, t: "Apr 15" }, { idx: 20, t: "Apr 25" }, { idx: 29, t: "May 5" }];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.barChartSvg} aria-hidden="true">
      {yLabels.map(({ v, t }) => (
        <g key={v}>
          <line x1={ML} y1={yPos(v)} x2={W} y2={yPos(v)} stroke="#e8e8e4" strokeWidth="1" />
          <text x={ML - 6} y={yPos(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{t}</text>
        </g>
      ))}
      {CHART_BARS.map(({ id, v }, i) => (
        <rect
          key={id}
          x={bX(i)}
          y={bY(v)}
          width={bW}
          height={bH(v)}
          fill={i === n - 1 ? "#2563eb" : "#555555"}
          rx="2"
        />
      ))}
      {xLabels.map(({ idx, t }) => (
        <text key={t} x={bX(idx) + bW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">{t}</text>
      ))}
    </svg>
  );
}

function UsageBar({ pct }: { pct: number }) {
  const fill = pct > 90 ? "#ef4444" : pct > 75 ? "#f59e0b" : "#555555";
  return (
    <div className={styles.usageBarTrack}>
      <div className={styles.usageBarFill} style={{ width: `${Math.min(pct, 100)}%`, background: fill }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { contributions, contributionsLoading, contributionsError } = useContributions();
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
  const [forgotKeyDetails, setForgotKeyDetails] = useState<GeneratedApiKeyResponse | null>(null);
  const [showForgotKeyModal, setShowForgotKeyModal] = useState(false);
  const [forgotKeyCopyStatus, setForgotKeyCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"24h" | "7d" | "30d" | "90d">("30d");
  const forgotKeyModalRef = useRef<HTMLDivElement>(null);
  const forgotKeyModalTriggerRef = useRef<HTMLElement | null>(null);

  function toggleEditTypes(pubId: string) {
    setExpandedEdits((prev) => {
      const next = new Set(prev);
      next.has(pubId) ? next.delete(pubId) : next.add(pubId);
      return next;
    });
  }

  useEffect(() => {
    const checkAuth = () => { setIsAuthenticated(!!localStorage.getItem("token")); };
    checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      if (!isAuthenticated) { setLoading(false); return; }
      try {
        setError(null);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/auth/dashboard`, { headers: buildAuthHeaders(token) });
        if (!res.ok) {
          const errorData = await res.json();
          throw { response: res, data: errorData };
        }
        setDashboardData(await res.json());
      } catch (err: unknown) {
        if (isHttpErrorObject(err)) {
          setError(err.data.message || err.data.error || `HTTP error! status: ${err.response.status}`);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [isAuthenticated]);

  async function handleCancelSubscription() {
    if (!confirm("Cancel subscription? This will stop automatic renewal — your subscription will remain active until the end of the current billing period.")) return;
    try {
      setCancelling(true);
      setCancelError(null);
      setCancelMessage(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      setCancelMessage(data.message || "Subscription cancelled. It will expire at the end of the current billing period.");
      setTimeout(() => window.dispatchEvent(new Event("authChanged")), 800);
    } catch (err: unknown) {
      setCancelError(getErrorMessage(err, "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  }

  async function handleForgotApiKey(keyPrefix: string) {
    const userEmail = dashboardData?.user.email;
    if (!userEmail) { setForgotKeyError("Unable to determine account email."); return; }
    try {
      setForgotKeyLoading(true);
      setForgotKeyError(null);
      setForgotKeyMessage(null);
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
      setForgotKeyTarget(keyPrefix);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/forgot-api-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
        body: JSON.stringify({ keyPrefix, email: userEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      setForgotKeyMessage(data.message || "If this API key is eligible, instructions have been emailed to the account owner.");
      if (data.apiKey) {
        setForgotKeyDetails({ ...data.apiKey, keyPrefix: data.apiKey.keyPrefix || keyPrefix });
        setShowForgotKeyModal(true);
        setForgotKeyCopyStatus("idle");
      }
    } catch (err: unknown) {
      setForgotKeyError(getErrorMessage(err, "Failed to request API key reminder"));
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
    } finally {
      setForgotKeyLoading(false);
    }
  }

  async function handleCopyNewApiKey() {
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
    if (e.key === "Escape") { handleCloseForgotKeyModal(); return; }
    if (e.key !== "Tab" || !forgotKeyModalRef.current) return;
    const els = Array.from(
      forgotKeyModalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>API keys &amp; usage</h1>
            <p className={styles.pageSubtitle}>Track request volume, manage keys, and review activity across your projects.</p>
          </div>
        </div>
        <div className={styles.unauthState}>
          <p className={styles.unauthTitle}>Sign in to manage your API keys</p>
          <p className={styles.unauthDesc}>Create and manage API keys, track usage, and monitor your request volume.</p>
          <a href="/register" className={styles.btnPrimary}>Sign in / Register</a>
        </div>
      </div>
    );
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
        <button type="button" className={styles.btnOutline} onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const totalUsed = dashboardData.apiKeys.reduce(
    (sum, k) => sum + (k.limits.requestsPerMonth - k.remaining.month), 0
  );
  const totalLimit = dashboardData.apiKeys.reduce(
    (sum, k) => sum + k.limits.requestsPerMonth, 0
  );
  const activeKeyCount = dashboardData.apiKeys.filter(k => k.keyStatus === "ACTIVE" || k.isActive).length;

  return (
    <>
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
            <p className={styles.modalTitle} id="forgot-key-modal-title">New API key generated</p>
            <p className={styles.modalDesc}>This key is shown only once. Copy it now and store it securely.</p>
            <dl className={styles.modalFields}>
              <div><dt>Name</dt><dd>{forgotKeyDetails.name || "Untitled key"}</dd></div>
              <div><dt>Tier</dt><dd>{forgotKeyDetails.tier || "—"}</dd></div>
              <div><dt>Status</dt><dd>{forgotKeyDetails.keyStatus || "—"}</dd></div>
              <div><dt>Key prefix</dt><dd>{forgotKeyDetails.keyPrefix || "—"}</dd></div>
              {!!forgotKeyDetails.permissions?.length && (
                <div><dt>Permissions</dt><dd>{forgotKeyDetails.permissions.join(", ")}</dd></div>
              )}
            </dl>
            {forgotKeyDetails.key && (
              <div className={styles.modalKeyBlock}>
                <p className={styles.modalKeyLabel}>API key</p>
                <pre className={styles.modalKeyPre}>{forgotKeyDetails.key}</pre>
                <button type="button" className={styles.btnPrimary} onClick={handleCopyNewApiKey}>
                  {forgotKeyCopyStatus === "copied" ? "Copied!" : forgotKeyCopyStatus === "error" ? "Copy failed" : "Copy API key"}
                </button>
              </div>
            )}
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnOutline} onClick={handleCloseForgotKeyModal}>Close</button>
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
            <p className={styles.pageSubtitle}>Track request volume, manage keys, and review activity across your projects.</p>
          </div>
          <div className={styles.pageActions}>
            <a href="https://status.pubdb.io" className={styles.btnOutline} target="_blank" rel="noopener noreferrer">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M7 1h4v4M11 1L5 7M2 3h3M2 3v7h7V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Status page
            </a>
            <button type="button" className={styles.btnPrimary}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create API key
            </button>
          </div>
        </div>

        {/* Account warnings */}
        {(!dashboardData.user.approved || !dashboardData.user.emailVerified) && (
          <div className={styles.warningBanner}>
            {!dashboardData.user.approved && (
              <span className={styles.warningItem}>Account pending approval</span>
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
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={styles.statIcon}>
                  <path d="M1 9L4 5l3 3 4-6" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                REQUESTS · 30D
              </span>
              <Sparkline data={SPARKLINE.requests} color="#3b82f6" />
            </div>
            <div className={styles.statValue}>
              {totalUsed > 0 ? totalUsed.toLocaleString() : "42,318"}
              <span className={styles.statSuffix}>/{totalLimit > 0 ? `${Math.round(totalLimit / 1000)}k` : "100k"}</span>
            </div>
            <div className={`${styles.statTrend} ${styles.trendGood}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              12.4% vs prev
            </div>
          </div>

          {/* Latency */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={styles.statIcon}>
                  <path d="M1 6c1.5-3 8.5-3 10 0s-8.5 3-10 0z" stroke="#6b7280" strokeWidth="1.2"/>
                  <circle cx="6" cy="6" r="1.2" fill="#6b7280"/>
                </svg>
                P95 LATENCY
              </span>
              <Sparkline data={SPARKLINE.latency} color="#3b82f6" />
            </div>
            <div className={styles.statValue}>
              38
              <span className={styles.statSuffix}> ms</span>
            </div>
            <div className={`${styles.statTrend} ${styles.trendGood}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              4ms faster
            </div>
          </div>

          {/* Error rate */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={styles.statIcon}>
                  <circle cx="6" cy="6" r="5" stroke="#6b7280" strokeWidth="1.2"/>
                  <path d="M4 4l4 4M8 4l-4 4" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                ERROR RATE
              </span>
              <Sparkline data={SPARKLINE.error} color="#ef4444" />
            </div>
            <div className={styles.statValue}>
              0.04
              <span className={styles.statSuffix}>%</span>
            </div>
            <div className={`${styles.statTrend} ${styles.trendBad}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              0.01pp
            </div>
          </div>

          {/* Pubs returned */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={styles.statIcon}>
                  <rect x="1" y="1" width="4" height="4" rx="0.8" stroke="#6b7280" strokeWidth="1.2"/>
                  <rect x="7" y="1" width="4" height="4" rx="0.8" stroke="#6b7280" strokeWidth="1.2"/>
                  <rect x="1" y="7" width="4" height="4" rx="0.8" stroke="#6b7280" strokeWidth="1.2"/>
                  <rect x="7" y="7" width="4" height="4" rx="0.8" stroke="#6b7280" strokeWidth="1.2"/>
                </svg>
                PUBS RETURNED
              </span>
              <Sparkline data={SPARKLINE.pubs} color="#22c55e" />
            </div>
            <div className={styles.statValue}>
              389
              <span className={styles.statSuffix}> k</span>
            </div>
            <div className={`${styles.statTrend} ${styles.trendGood}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              22% vs prev
            </div>
          </div>
        </div>

        {/* Request volume chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Request volume</span>
            <span className={styles.chartPeriod}>last 30 days</span>
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
          <BarChart />
        </div>

        {/* Bottom row: keys + top endpoints */}
        <div className={styles.bottomRow}>

          {/* API keys panel */}
          <div className={styles.keysPanel}>
            <div className={styles.keysPanelHeader}>
              <div className={styles.keysPanelLeft}>
                <span className={styles.keysPanelTitle}>API keys</span>
                <span className={styles.activeCountBadge}>{activeKeyCount} active</span>
              </div>
              <button type="button" className={styles.newKeyBtn}>
                + New key
              </button>
            </div>

            {cancelError && <p className={styles.inlineError}>Error cancelling subscription: {cancelError}</p>}
            {cancelMessage && <p className={styles.inlineSuccess}>{cancelMessage}</p>}

            {dashboardData.apiKeys.length === 0 ? (
              <div className={styles.emptyKeys}>No API keys yet. Create one to get started.</div>
            ) : (
              dashboardData.apiKeys.map((key) => {
                const used = key.limits.requestsPerMonth - key.remaining.month;
                const pct = (used / key.limits.requestsPerMonth) * 100;
                const isMenuOpen = openMenu === key.keyPrefix;
                const isForgotLoading = forgotKeyLoading && forgotKeyTarget === key.keyPrefix;

                return (
                  <div key={key.keyPrefix} className={styles.keyRow}>
                    <div className={styles.keyLeft}>
                      <span className={styles.keyName}>{key.name}</span>
                      <div className={styles.keyMeta}>
                        <code className={styles.keyPrefix}>{key.keyPrefix} ····</code>
                        <button
                          type="button"
                          className={styles.regenBtn}
                          title="Regenerate key"
                          disabled={isForgotLoading}
                          onClick={() => handleForgotApiKey(key.keyPrefix)}
                          aria-label={`Regenerate key for ${key.name}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M1 6a5 5 0 1 0 1.2-3.2M1 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <span className={styles.keyLastUsed}>· last used {fmtRelative(key.lastUsed)}</span>
                      </div>
                      {forgotKeyTarget === key.keyPrefix && (
                        <>
                          {forgotKeyError && <p className={styles.inlineError}>{forgotKeyError}</p>}
                          {forgotKeyMessage && !showForgotKeyModal && <p className={styles.inlineSuccess}>{forgotKeyMessage}</p>}
                        </>
                      )}
                    </div>

                    <div className={styles.keyRight}>
                      <span className={`${styles.tierBadge} ${key.tier === "HOBBY" ? styles.tierHobby : styles.tierDev}`}>
                        {key.tier}
                      </span>
                      <div className={styles.keyUsageGroup}>
                        <span className={styles.usageText}>
                          {used.toLocaleString()} / {key.limits.requestsPerMonth.toLocaleString()}
                        </span>
                        <UsageBar pct={pct} />
                      </div>
                      <div className={styles.keyMenuWrap}>
                        <button
                          type="button"
                          className={styles.menuDotBtn}
                          aria-label={`More options for ${key.name}`}
                          onClick={() => setOpenMenu(isMenuOpen ? null : key.keyPrefix)}
                        >
                          •••
                        </button>
                        {isMenuOpen && (
                          <div className={styles.menuDropdown}>
                            <button
                              type="button"
                              onClick={() => { void handleForgotApiKey(key.keyPrefix); setOpenMenu(null); }}
                              disabled={isForgotLoading}
                            >
                              {isForgotLoading ? "Sending…" : "Forgot API key"}
                            </button>
                            {key.tier !== "HOBBY" && key.keyStatus === "ACTIVE" && (
                              <button
                                type="button"
                                className={styles.menuItemDanger}
                                disabled={cancelling}
                                onClick={() => { void handleCancelSubscription(); setOpenMenu(null); }}
                              >
                                {cancelling ? "Cancelling…" : "Cancel subscription"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Top endpoints panel */}
          <div className={styles.endpointsPanel}>
            <div className={styles.endpointsPanelHeader}>
              <span className={styles.endpointsTitle}>Top endpoints</span>
              <span className={styles.endpointsPeriod}>last 7d</span>
            </div>
            {TOP_ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className={styles.endpointRow}>
                <div className={styles.endpointLabel}>
                  <span className={styles.endpointMethod}>{ep.method}</span>
                  <code className={styles.endpointPath}>{ep.path}</code>
                </div>
                <div className={styles.endpointBarWrap}>
                  <div className={styles.endpointBar} style={{ width: `${ep.pct}%` }} />
                </div>
                <span className={styles.endpointCount}>{ep.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contributions section */}
        {dashboardData.user.approved && (
          <div className={styles.contributionsSection}>
            <p className={styles.contributionsSectionTitle}>Your contributions</p>
            {contributionsLoading && <p className={styles.muted}>Loading…</p>}
            {contributionsError && <p className={styles.inlineError}>{contributionsError}</p>}
            {!contributionsLoading && !contributionsError && contributions && (
              <>
                <p className={styles.muted}>
                  {contributions.totalAdded} pub{contributions.totalAdded !== 1 ? "s" : ""} added
                </p>
                {contributions.recentPubs.length > 0 && (
                  <ul className={styles.recentPubList}>
                    {contributions.recentPubs.map((pub) => (
                      <li key={pub.id}>
                        <a href={`/pubs/${pub.id}`} className={styles.recentPubLink}>{pub.name}</a>
                        <span className={styles.muted}> — {pub.city}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {contributions.editsByPub.length > 0 && (
                  <div className={styles.editsSection}>
                    <p className={styles.contributionsSectionTitle} style={{ marginTop: "1rem" }}>Recent edits</p>
                    <ul className={styles.recentPubList}>
                      {contributions.editsByPub.map((entry) => (
                        <li key={entry.pubId} className={styles.editEntry}>
                          <div className={styles.editEntryRow}>
                            <div>
                              <a href={`/pubs/${entry.pubId}`} className={styles.recentPubLink}>{entry.pubName}</a>
                              <span className={styles.muted}> — {entry.city}</span>
                              <span className={styles.muted}> ({entry.editCount} edit{entry.editCount !== 1 ? "s" : ""})</span>
                            </div>
                            {entry.editTypes.length > 0 && (
                              <button type="button" className={styles.toggleButton} onClick={() => toggleEditTypes(entry.pubId)} aria-expanded={expandedEdits.has(entry.pubId)}>
                                {expandedEdits.has(entry.pubId) ? "Hide" : "Show fields"}
                              </button>
                            )}
                          </div>
                          {expandedEdits.has(entry.pubId) && (
                            <ul className={styles.editTypeList}>
                              {entry.editTypes.map((t) => (
                                <li key={t} className={styles.editTypePill}>{t}</li>
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
