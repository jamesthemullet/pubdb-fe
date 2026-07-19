"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import Pricing from "@/app/features/pricing/pricing";
import { useAuth } from "@/hooks/useAuth";
import { buildAuthHeaders } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import styles from "./page.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiKey = {
  name: string;
  tier: string;
  isActive: boolean;
  usageCount: number;
};

type Subscription = {
  tier: string;
  remaining: { hour: number; day: number; month: number };
  limits: {
    requestsPerHour: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  resetTimes: { hour: string; day: string; month: string };
};

type DashboardData = {
  user: { name: string; email: string };
  apiKeys: ApiKey[];
  subscription?: Subscription;
  summary: { totalApiKeys: number; totalUsage: number };
};

type BillingData = {
  plan: {
    tier: string;
    price: number | null;
    currency: string | null;
    interval: string | null;
  };
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  billingDetails: {
    name?: string;
    email?: string;
    company?: string;
    vatNumber?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    };
  } | null;
  paymentMethod: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  } | null;
  upcomingInvoice: {
    amount: number;
    currency: string;
    dueDate: string | null;
  } | null;
  invoices: Array<{
    id?: string;
    amount: number;
    currency: string;
    date: string;
    description: string;
    billingPeriod?: { start: string; end: string } | string;
    status: string;
    hostedUrl?: string;
    pdfUrl?: string;
  }>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatResetTime(
  iso: string,
  period: "hour" | "day" | "month"
): string {
  const date = new Date(iso);
  if (period === "hour") {
    const mins = Math.round((date.getTime() - Date.now()) / 60000);
    return mins > 0 ? `resets in ${mins} min` : "resetting…";
  }
  if (period === "day") {
    return `resets at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return `resets ${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

function usageMeters(subscription: Subscription) {
  const { limits, remaining, resetTimes } = subscription;
  return [
    {
      label: "HOURLY",
      used: limits.requestsPerHour - remaining.hour,
      limit: limits.requestsPerHour,
      pct:
        ((limits.requestsPerHour - remaining.hour) / limits.requestsPerHour) *
        100,
      reset: formatResetTime(resetTimes.hour, "hour"),
    },
    {
      label: "DAILY",
      used: limits.requestsPerDay - remaining.day,
      limit: limits.requestsPerDay,
      pct:
        ((limits.requestsPerDay - remaining.day) / limits.requestsPerDay) * 100,
      reset: formatResetTime(resetTimes.day, "day"),
    },
    {
      label: "MONTHLY",
      used: limits.requestsPerMonth - remaining.month,
      limit: limits.requestsPerMonth,
      pct:
        ((limits.requestsPerMonth - remaining.month) /
          limits.requestsPerMonth) *
        100,
      reset: formatResetTime(resetTimes.month, "month"),
    },
  ];
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatCurrency(amountInCents: number, currency: string): string {
  const symbol =
    currency.toLowerCase() === "gbp"
      ? "£"
      : currency.toLowerCase() === "usd"
      ? "$"
      : `${currency.toUpperCase()} `;
  return `${symbol}${(amountInCents / 100).toFixed(2)}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPeriod(startMs: number, endMs: number): string {
  const s = new Date(startMs).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const e = new Date(endMs).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `${s} – ${e}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const headers = buildAuthHeaders(token);
    fetch("/api/auth/dashboard", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDashboardData(data);
      })
      .catch(() => {});
    fetch("/api/payments/billing", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setBillingData(data);
      })
      .catch(() => {});
  }, [user]);

  async function handleCancelSubscription() {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw data || new Error(`HTTP error ${res.status}`);
      setCancelMessage(
        data.message ||
          "Subscription cancelled. It will expire at the end of the current billing period."
      );
      setBillingData((prev) =>
        prev ? { ...prev, cancelAtPeriodEnd: true } : prev
      );
    } catch (err: unknown) {
      setCancelError(getErrorMessage(err, "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  }

  const USAGE = dashboardData?.subscription
    ? usageMeters(dashboardData.subscription)
    : null;

  const sortedInvoices = useMemo(
    () =>
      billingData?.invoices
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ) ?? [],
    [billingData]
  );

  const { spendBars, maxSpend } = useMemo(() => {
    const bars = sortedInvoices
      .slice(0, 6)
      .reverse()
      .map((inv, i, arr) => ({
        month: new Date(inv.date).toLocaleDateString("en-GB", {
          month: "short",
        }),
        amount: inv.amount / 100,
        current: i === arr.length - 1,
      }));
    return {
      spendBars: bars,
      maxSpend: bars.length > 0 ? Math.max(...bars.map((b) => b.amount)) : 1,
    };
  }, [sortedInvoices]);

  const currentPeriodEndDate = billingData?.currentPeriodEnd
    ? new Date(billingData.currentPeriodEnd)
    : null;
  const renewsLabel = currentPeriodEndDate
    ? `renews ${currentPeriodEndDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : null;

  const upcoming = billingData?.upcomingInvoice ?? null;
  const upcomingDueDate = upcoming?.dueDate
    ? new Date(upcoming.dueDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : null;

  const billingFields = useMemo(() => {
    const bd = billingData?.billingDetails ?? null;
    if (!bd) return [] as { label: string; value: string; link: boolean; mono: boolean }[];
    return [
      bd.name
        ? { label: "Account", value: bd.name, link: false, mono: false }
        : null,
      bd.company
        ? { label: "Company", value: bd.company, link: false, mono: false }
        : null,
      bd.email
        ? { label: "Email", value: bd.email, link: true, mono: false }
        : null,
      bd.vatNumber
        ? {
            label: "VAT number",
            value: bd.vatNumber,
            link: false,
            mono: true,
          }
        : null,
      bd.address?.line1
        ? {
            label: "Address",
            value: [
              bd.address.line1,
              bd.address.line2,
              bd.address.city,
              bd.address.postal_code,
            ]
              .filter(Boolean)
              .join("\n"),
            link: false,
            mono: false,
          }
        : null,
    ].filter(Boolean) as { label: string; value: string; link: boolean; mono: boolean }[];
  }, [billingData]);

  const currencyLabel = billingData?.plan.currency?.toUpperCase() ?? "GBP";
  const acctId = billingData?.stripeCustomerId ?? null;
  const isHobby = billingData?.plan.tier?.toUpperCase() === "HOBBY";

  if (!user) {
    return <AuthGate context="Billing" />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Billing</h1>
            {acctId && (
              <span className={styles.acctBadge}>
                {acctId} · {currencyLabel}
              </span>
            )}
          </div>
          <p className={styles.description}>
            {isHobby
              ? "You're on the free Hobby plan. Upgrade anytime to unlock higher limits and paid features."
              : "Manage your plan, payment method, and invoices. Usage charges roll up into a single monthly invoice — no surprises mid-cycle."}
          </p>
        </div>
      </div>

      {/* Two-column body */}
      <div className={styles.body}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          {/* Current plan */}
          <div className={styles.card}>
            <div className={styles.planTopRow}>
              <div>
                <p className={styles.cardEyebrow}>CURRENT PLAN</p>
                <div className={styles.planNameRow}>
                  <h2 className={styles.planName}>
                    {billingData
                      ? billingData.plan.tier.charAt(0).toUpperCase() +
                        billingData.plan.tier.slice(1).toLowerCase()
                      : "—"}
                  </h2>
                  <span className={styles.activeBadge}>
                    {billingData?.status?.toUpperCase() ?? "ACTIVE"}
                  </span>
                </div>
                <p className={styles.planPrice}>
                  {billingData?.plan.price != null &&
                  billingData.plan.currency ? (
                    <>
                      <span className={styles.planAmount}>
                        {formatCurrency(
                          billingData.plan.price,
                          billingData.plan.currency
                        ).replace(/\.00$/, "")}
                      </span>
                      <span className={styles.planPer}>
                        /{billingData.plan.interval ?? "month"}
                      </span>
                      {renewsLabel && (
                        <span className={styles.planRenews}>
                          · {renewsLabel}
                        </span>
                      )}
                    </>
                  ) : null}
                </p>
              </div>
              <div className={styles.planActions}>
                <button
                  type="button"
                  className={styles.upgradeBtn}
                  onClick={() =>
                    document
                      .getElementById("change-plan")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Upgrade plan →
                </button>
                {!isHobby && (
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    disabled={
                      cancelling || !billingData || billingData.cancelAtPeriodEnd
                    }
                    onClick={() => {
                      void handleCancelSubscription();
                    }}
                  >
                    {cancelling ? "Cancelling…" : "Cancel subscription"}
                  </button>
                )}
                {cancelMessage && (
                  <p className={styles.cancelSuccess}>{cancelMessage}</p>
                )}
                {cancelError && (
                  <p className={styles.cancelError}>{cancelError}</p>
                )}
              </div>
            </div>

            {/* Usage meters */}
            <div className={styles.usageGrid}>
              {USAGE ? (
                USAGE.map((u, i) => (
                  <div
                    key={u.label}
                    className={`${styles.usageMeter} ${
                      i < USAGE.length - 1 ? styles.usageMeterBorder : ""
                    }`}
                  >
                    <div className={styles.usageTopRow}>
                      <span className={styles.usageLabel}>{u.label}</span>
                      <span className={styles.usagePct}>
                        {u.pct.toFixed(1)}%
                      </span>
                    </div>
                    <p className={styles.usageFraction}>
                      <span className={styles.usageUsed}>
                        {u.used.toLocaleString()}
                      </span>
                      <span className={styles.usageSep}> / </span>
                      <span className={styles.usageLimit}>
                        {u.limit.toLocaleString()}
                      </span>
                    </p>
                    <div className={styles.usageBarWrap}>
                      <div
                        className={styles.usageBar}
                        style={{ width: `${u.pct}%` }}
                      />
                    </div>
                    <p className={styles.usageReset}>{u.reset}</p>
                  </div>
                ))
              ) : (
                <p className={styles.usageLoading}>Loading usage…</p>
              )}
            </div>
          </div>

          {/* Upcoming bill */}
          {!isHobby && <div className={styles.card}>
            <div className={styles.billHeader}>
              <div className={styles.billHeaderLeft}>
                <span className={styles.billTitle}>Upcoming bill</span>
                {upcomingDueDate && (
                  <span className={styles.billDate}>
                    posts {upcomingDueDate}
                  </span>
                )}
              </div>
              <span className={styles.withinPlanBadge}>
                <span className={styles.withinPlanDot} />
                Within plan
              </span>
            </div>

            {upcoming ? (
              <>
                <div className={styles.invoiceLines}>
                  <div className={styles.invoiceLine}>
                    <div className={styles.invoiceLineLeft}>
                      <span className={styles.invoiceLineTitle}>
                        {billingData?.plan.tier
                          ? `${
                              billingData.plan.tier.charAt(0).toUpperCase() +
                              billingData.plan.tier.slice(1).toLowerCase()
                            } plan`
                          : "Subscription"}
                      </span>
                      <span className={styles.invoiceLineDetail}>
                        base subscription
                      </span>
                    </div>
                    <span className={styles.invoiceLineAmount}>
                      {formatCurrency(upcoming.amount, upcoming.currency)}
                    </span>
                  </div>
                </div>
                <div className={styles.invoiceTotal}>
                  <span className={styles.invoiceTotalLabel}>
                    {upcomingDueDate
                      ? `Total due ${upcomingDueDate}`
                      : "Total due"}
                  </span>
                  <span className={styles.invoiceTotalAmount}>
                    {formatCurrency(upcoming.amount, upcoming.currency)}
                  </span>
                </div>
              </>
            ) : (
              <p className={styles.usageLoading}>Loading…</p>
            )}
          </div>}
        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>
          {/* Payment method */}
          <div className={styles.card}>
            <div className={styles.pmHeader}>
              <span className={styles.pmTitle}>Payment method</span>
            </div>
            {billingData?.paymentMethod ? (
              <p className={styles.pmPortalNote}>
                {billingData.paymentMethod.brand
                  ? `${billingData.paymentMethod.brand
                      .charAt(0)
                      .toUpperCase()}${billingData.paymentMethod.brand.slice(
                      1
                    )}`
                  : "Card"}
                {billingData.paymentMethod.last4 &&
                  ` ending ${billingData.paymentMethod.last4}`}
                {billingData.paymentMethod.expMonth &&
                  billingData.paymentMethod.expYear &&
                  ` · expires ${billingData.paymentMethod.expMonth}/${billingData.paymentMethod.expYear}`}
              </p>
            ) : (
              <p className={styles.pmPortalNote}>No payment method on file.</p>
            )}
          </div>

          {/* Spend chart */}
          {!isHobby && <div className={styles.card}>
            <div className={styles.spendHeader}>
              <span className={styles.spendLabel}>SPEND · LAST 6 INVOICES</span>
              {spendBars.length > 0 && (
                <span className={styles.spendCurrent}>
                  {formatCurrency(
                    sortedInvoices[0]?.amount ?? 0,
                    sortedInvoices[0]?.currency ?? "usd"
                  )}
                </span>
              )}
            </div>
            {spendBars.length > 0 ? (
              <div className={styles.spendChart}>
                {spendBars.map((bar) => (
                  <div key={bar.month} className={styles.spendBarCol}>
                    <div className={styles.spendBarTrack}>
                      <div
                        className={`${styles.spendBar} ${
                          bar.current ? styles.spendBarCurrent : ""
                        }`}
                        style={{ height: `${(bar.amount / maxSpend) * 100}%` }}
                      />
                    </div>
                    <span className={styles.spendBarMonth}>{bar.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.usageLoading}>Loading…</p>
            )}
          </div>}
        </div>
      </div>  {/* body */}

      {/* ── Change plan ── */}
      <div id="change-plan" className={styles.pricingSection}>
        <Pricing />
      </div>

      {/* ── Invoices ── */}
      {!isHobby && <div className={styles.section}>
        <div className={styles.sectionTopRow}>
          <div className={styles.invoicesHeadingRow}>
            <h2 className={styles.sectionTitle}>Invoices</h2>
            <span className={styles.invoicesPeriod}>last 12 months</span>
          </div>
        </div>
        <div className={styles.invoicesTable}>
          <div className={styles.invoicesTableHead}>
            <span className={styles.invoicesColInvoice}>INVOICE</span>
            <span className={styles.invoicesColDate}>DATE</span>
            <span className={styles.invoicesColPeriod}>PERIOD</span>
            <span className={styles.invoicesColAmount}>AMOUNT</span>
            <span className={styles.invoicesColStatus}>STATUS</span>
          </div>
          {sortedInvoices.map((inv, i) => (
            <div key={inv.id ?? i} className={styles.invoiceRow}>
              <span
                className={`${styles.invoicesColInvoice} ${styles.invoiceId}`}
              >
                {inv.description}
              </span>
              <span className={styles.invoicesColDate}>
                {formatDate(new Date(inv.date).getTime())}
              </span>
              <span className={styles.invoicesColPeriod}>
                {inv.billingPeriod
                  ? typeof inv.billingPeriod === "string"
                    ? inv.billingPeriod
                    : formatPeriod(
                        new Date(inv.billingPeriod.start).getTime(),
                        new Date(inv.billingPeriod.end).getTime()
                      )
                  : "—"}
              </span>
              <span
                className={`${styles.invoicesColAmount} ${styles.invoiceAmount}`}
              >
                {formatCurrency(inv.amount, inv.currency)}
              </span>
              <div
                className={`${styles.invoicesColStatus} ${styles.invoiceStatusCell}`}
              >
                <span className={styles.paidBadge}>
                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                </span>
                {inv.id && (
                  <button
                    type="button"
                    className={styles.invoiceIconBtn}
                    aria-label="Copy invoice ID"
                    onClick={() => navigator.clipboard.writeText(inv.id ?? "")}
                  >
                    <CopySmIcon />
                  </button>
                )}
                {inv.hostedUrl && (
                  <a
                    href={inv.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.invoiceIconBtn}
                    aria-label="Open invoice"
                  >
                    <ExternalSmIcon />
                  </a>
                )}
              </div>
            </div>
          ))}
          {!billingData && (
            <p className={styles.usageLoading}>Loading invoices…</p>
          )}
        </div>
      </div>}

      {/* ── Billing details + Tax & compliance ── */}
      <div className={styles.bottomGrid}>
        {/* Billing details */}
        {!isHobby && <div className={styles.card}>
          <div className={styles.bdHeader}>
            <h2 className={styles.sectionTitle}>Billing details</h2>
          </div>
          <div className={styles.bdFields}>
            {billingFields.length > 0 ? (
              billingFields.map((field) => (
                <div key={field.label} className={styles.bdRow}>
                  <span className={styles.bdLabel}>{field.label}</span>
                  {field.link ? (
                    <a href={`mailto:${field.value}`} className={styles.bdLink}>
                      {field.value}
                    </a>
                  ) : (
                    <span
                      className={`${styles.bdValue} ${
                        field.mono ? styles.bdValueMono : ""
                      }`}
                    >
                      {field.value.split("\n").map((line, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: address line list
                        <span key={i} className={styles.bdValueLine}>
                          {line}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.usageLoading}>Loading…</p>
            )}
          </div>
        </div>}

        {/* Tax & compliance */}
        {!isHobby && <div className={styles.card}>
          <div className={styles.bdHeader}>
            <h2 className={styles.sectionTitle}>Tax &amp; compliance</h2>
          </div>
          <div className={styles.taxItems}>
            <div className={styles.taxRow}>
              <span className={styles.taxIcon}>
                <TaxCardIcon />
              </span>
              <div className={styles.taxInfo}>
                <span className={styles.taxTitle}>Auto-charge enabled</span>
                <span className={styles.taxDetail}>
                  {currentPeriodEndDate
                    ? `Card charged on the ${currentPeriodEndDate.getDate()}${nth(
                        currentPeriodEndDate.getDate()
                      )} of each month`
                    : "Card charged monthly"}
                </span>
              </div>
            </div>
            <div className={styles.taxRow}>
              <span className={styles.taxIcon}>
                <TaxGlobeIcon />
              </span>
              <div className={styles.taxInfo}>
                <span className={styles.taxTitle}>
                  Invoiced in {currencyLabel}
                </span>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

function nth(d: number): string {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CopySmIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="3.5"
        width="8"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4.5 2H11a1 1 0 011 1v7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalSmIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 6.5V10a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h3.5M8 1h3m0 0v3m0-3L5 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TaxCardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="3.5"
        width="14"
        height="9"
        rx="1.5"
        stroke="#6366f1"
        strokeWidth="1.2"
      />
      <path d="M1 6.5h14" stroke="#6366f1" strokeWidth="1.2" />
    </svg>
  );
}

function TaxGlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" stroke="#6b7280" strokeWidth="1.2" />
      <path
        d="M8 1c-2 2-3 4-3 7s1 5 3 7M8 1c2 2 3 4 3 7s-1 5-3 7M1 8h14"
        stroke="#6b7280"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
