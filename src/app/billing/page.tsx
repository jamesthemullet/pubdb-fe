"use client";

import AuthGate from "@/app/components/auth-gate/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

// ── Static mock data ──────────────────────────────────────────────────────────

const USAGE = [
  {
    label: "HOURLY",
    used: 342,
    limit: 1000,
    pct: 34.2,
    reset: "resets in 38 min",
  },
  {
    label: "DAILY",
    used: 4128,
    limit: 10000,
    pct: 41.3,
    reset: "resets at midnight",
  },
  {
    label: "MONTHLY",
    used: 42318,
    limit: 100000,
    pct: 42.3,
    reset: "resets 12 Jun",
  },
];

const INVOICE_LINES = [
  {
    title: "Developer plan",
    detail: "13 May – 12 Jun · base subscription",
    amount: "£9.00",
  },
  {
    title: "Overage",
    detail: "0 requests over 100,000 quota",
    amount: "£0.00",
  },
  {
    title: "VAT",
    detail: "GB · 20%",
    amount: "£1.80",
  },
];

const SPEND_BARS = [
  { month: "Dec", amount: 9.0 },
  { month: "Jan", amount: 9.0 },
  { month: "Feb", amount: 9.0 },
  { month: "Mar", amount: 10.8 },
  { month: "Apr", amount: 9.0 },
  { month: "May", amount: 10.8, current: true },
];

const MAX_SPEND = Math.max(...SPEND_BARS.map((b) => b.amount));

const PLANS = [
  {
    id: "hobby",
    label: "HOBBY",
    tag: "FREE",
    price: "£0",
    requests: "1,000 requests / month",
    current: false,
    cta: "Downgrade",
    ctaVariant: "outline" as const,
  },
  {
    id: "developer",
    label: "DEVELOPER",
    tag: "CURRENT",
    price: "£9",
    requests: "100,000 requests / month",
    current: true,
    cta: "Current plan",
    ctaVariant: "outline" as const,
  },
  {
    id: "business",
    label: "BUSINESS",
    tag: "POPULAR",
    price: "£19",
    requests: "500,000 requests / month",
    current: false,
    cta: "Upgrade",
    ctaVariant: "solid" as const,
  },
];

const INVOICES = [
  { id: "in_2026_05", date: "12 May 2026", period: "Apr 12 – May 12", amount: "£10.80", status: "Paid" },
  { id: "in_2026_04", date: "12 Apr 2026", period: "Mar 12 – Apr 12", amount: "£10.80", status: "Paid" },
  { id: "in_2026_03", date: "12 Mar 2026", period: "Feb 12 – Mar 12", amount: "£10.80", status: "Paid" },
  { id: "in_2026_02", date: "12 Feb 2026", period: "Jan 12 – Feb 12", amount: "£10.80", status: "Paid" },
  { id: "in_2026_01", date: "12 Jan 2026", period: "Dec 12 – Jan 12", amount: "£10.80", status: "Paid" },
  { id: "in_2025_12", date: "12 Dec 2025", period: "Nov 12 – Dec 12 · Hobby → Developer", amount: "£7.21", status: "Paid" },
];

const BILLING_DETAILS = [
  { label: "Account", value: "Sam Mott" },
  { label: "Company", value: "Pintly Ltd." },
  { label: "Email", value: "billing@pintly.app", link: true },
  { label: "VAT number", value: "GB 384 729 102", mono: true },
  { label: "Address", value: "22 Bermondsey Street\nLondon SE1 3XB" },
];

const TAX_ITEMS = [
  {
    icon: "check" as const,
    title: "VAT reverse charge applies",
    detail: "UK B2B · VAT shown for record only",
  },
  {
    icon: "card" as const,
    title: "Auto-charge enabled",
    detail: "Card charged on the 12th of each month",
  },
  {
    icon: "globe" as const,
    title: "Invoiced in GBP",
    detail: "Switch currency in billing details",
    detailLink: true,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user } = useAuth();

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
            <span className={styles.acctBadge}>acct_8f1a3b4c · GBP</span>
          </div>
          <p className={styles.description}>
            Manage your plan, payment method, and invoices. Usage charges roll up into a
            single monthly invoice — no surprises mid-cycle.
          </p>
        </div>
        <a
          href="https://billing.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.stripePortalBtn}
        >
          <ExternalIcon />
          Stripe portal
        </a>
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
                  <h2 className={styles.planName}>Developer</h2>
                  <span className={styles.activeBadge}>ACTIVE</span>
                </div>
                <p className={styles.planPrice}>
                  <span className={styles.planAmount}>£9</span>
                  <span className={styles.planPer}>/month</span>
                  <span className={styles.planRenews}>· renews 12 Jun 2026</span>
                </p>
              </div>
              <div className={styles.planActions}>
                <button type="button" className={styles.upgradeBtn}>
                  Upgrade plan →
                </button>
                <button type="button" className={styles.cancelBtn}>
                  Cancel subscription
                </button>
              </div>
            </div>

            {/* Usage meters */}
            <div className={styles.usageGrid}>
              {USAGE.map((u, i) => (
                <div key={u.label} className={`${styles.usageMeter} ${i < USAGE.length - 1 ? styles.usageMeterBorder : ""}`}>
                  <div className={styles.usageTopRow}>
                    <span className={styles.usageLabel}>{u.label}</span>
                    <span className={styles.usagePct}>{u.pct}%</span>
                  </div>
                  <p className={styles.usageFraction}>
                    <span className={styles.usageUsed}>{u.used.toLocaleString()}</span>
                    <span className={styles.usageSep}> / </span>
                    <span className={styles.usageLimit}>{u.limit.toLocaleString()}</span>
                  </p>
                  <div className={styles.usageBarWrap}>
                    <div
                      className={styles.usageBar}
                      style={{ width: `${u.pct}%` }}
                    />
                  </div>
                  <p className={styles.usageReset}>{u.reset}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming bill */}
          <div className={styles.card}>
            <div className={styles.billHeader}>
              <div className={styles.billHeaderLeft}>
                <span className={styles.billTitle}>Upcoming bill</span>
                <span className={styles.billDate}>posts 12 Jun 2026</span>
              </div>
              <span className={styles.withinPlanBadge}>
                <span className={styles.withinPlanDot} />
                Within plan
              </span>
            </div>

            <div className={styles.invoiceLines}>
              {INVOICE_LINES.map((line) => (
                <div key={line.title} className={styles.invoiceLine}>
                  <div className={styles.invoiceLineLeft}>
                    <span className={styles.invoiceLineTitle}>{line.title}</span>
                    <span className={styles.invoiceLineDetail}>{line.detail}</span>
                  </div>
                  <span className={styles.invoiceLineAmount}>{line.amount}</span>
                </div>
              ))}
            </div>

            <div className={styles.invoiceTotal}>
              <span className={styles.invoiceTotalLabel}>Total due 12 Jun</span>
              <span className={styles.invoiceTotalAmount}>£10.80</span>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>
          {/* Payment method */}
          <div className={styles.card}>
            <div className={styles.pmHeader}>
              <span className={styles.pmTitle}>Payment method</span>
              <button type="button" className={styles.pmUpdateBtn}>
                <EditIcon /> Update
              </button>
            </div>

            <div className={styles.creditCard}>
              <div className={styles.creditCardTop}>
                <div className={styles.chip}>
                  <div className={styles.chipInner} />
                </div>
                <span className={styles.cardBrand}>VISA</span>
              </div>
              <div className={styles.cardNumber}>
                <span className={styles.cardDots}>•••• •••• ••••</span>
                <span className={styles.cardLast4}>4242</span>
              </div>
              <div className={styles.creditCardBottom}>
                <span className={styles.cardName}>SAM MOTT</span>
                <span className={styles.cardExpiry}>12 / 28</span>
              </div>
            </div>

            <p className={styles.stripeNote}>
              <LockIcon /> Stored securely with Stripe
            </p>
          </div>

          {/* Spend chart */}
          <div className={styles.card}>
            <div className={styles.spendHeader}>
              <span className={styles.spendLabel}>SPEND · LAST 6 INVOICES</span>
              <span className={styles.spendCurrent}>£10.80</span>
            </div>
            <div className={styles.spendChart}>
              {SPEND_BARS.map((bar) => (
                <div key={bar.month} className={styles.spendBarCol}>
                  <div className={styles.spendBarTrack}>
                    <div
                      className={`${styles.spendBar} ${bar.current ? styles.spendBarCurrent : ""}`}
                      style={{ height: `${(bar.amount / MAX_SPEND) * 100}%` }}
                    />
                  </div>
                  <span className={styles.spendBarMonth}>{bar.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* ── Change plan ── */}
      <div className={styles.section}>
        <div className={styles.sectionTopRow}>
          <h2 className={styles.sectionTitle}>Change plan</h2>
          <span className={styles.prorationsNote}>Prorations are calculated on confirmation</span>
        </div>
        <div className={styles.plansGrid}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${plan.current ? styles.planCardCurrent : ""}`}
            >
              <div className={styles.planCardTopRow}>
                <span className={styles.planCardLabel}>{plan.label}</span>
                <span className={`${styles.planCardTag} ${plan.tag === "CURRENT" ? styles.planCardTagCurrent : plan.tag === "POPULAR" ? styles.planCardTagPopular : ""}`}>
                  {plan.tag}
                </span>
              </div>
              <div className={styles.planCardPrice}>
                <span className={styles.planCardAmount}>{plan.price}</span>
                <span className={styles.planCardPer}>/mo</span>
              </div>
              <p className={styles.planCardRequests}>{plan.requests}</p>
              <button
                type="button"
                className={plan.ctaVariant === "solid" ? styles.planCtaSolid : styles.planCtaOutline}
                disabled={plan.current}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Invoices ── */}
      <div className={styles.section}>
        <div className={styles.sectionTopRow}>
          <div className={styles.invoicesHeadingRow}>
            <h2 className={styles.sectionTitle}>Invoices</h2>
            <span className={styles.invoicesPeriod}>last 12 months</span>
          </div>
          <button type="button" className={styles.exportCsvBtn}>
            <ExternalIcon /> Export CSV
          </button>
        </div>
        <div className={styles.invoicesTable}>
          <div className={styles.invoicesTableHead}>
            <span className={styles.invoicesColInvoice}>INVOICE</span>
            <span className={styles.invoicesColDate}>DATE</span>
            <span className={styles.invoicesColPeriod}>PERIOD</span>
            <span className={styles.invoicesColAmount}>AMOUNT</span>
            <span className={styles.invoicesColStatus}>STATUS</span>
          </div>
          {INVOICES.map((inv) => (
            <div key={inv.id} className={styles.invoiceRow}>
              <span className={`${styles.invoicesColInvoice} ${styles.invoiceId}`}>{inv.id}</span>
              <span className={styles.invoicesColDate}>{inv.date}</span>
              <span className={styles.invoicesColPeriod}>{inv.period}</span>
              <span className={`${styles.invoicesColAmount} ${styles.invoiceAmount}`}>{inv.amount}</span>
              <div className={`${styles.invoicesColStatus} ${styles.invoiceStatusCell}`}>
                <span className={styles.paidBadge}>{inv.status}</span>
                <button type="button" className={styles.invoiceIconBtn} aria-label="Copy invoice ID">
                  <CopySmIcon />
                </button>
                <button type="button" className={styles.invoiceIconBtn} aria-label="Open invoice">
                  <ExternalSmIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Billing details + Tax & compliance ── */}
      <div className={styles.bottomGrid}>
        {/* Billing details */}
        <div className={styles.card}>
          <div className={styles.bdHeader}>
            <h2 className={styles.sectionTitle}>Billing details</h2>
            <button type="button" className={styles.pmUpdateBtn}>
              <EditIcon /> Edit
            </button>
          </div>
          <div className={styles.bdFields}>
            {BILLING_DETAILS.map((field) => (
              <div key={field.label} className={styles.bdRow}>
                <span className={styles.bdLabel}>{field.label}</span>
                {field.link ? (
                  <a href={`mailto:${field.value}`} className={styles.bdLink}>{field.value}</a>
                ) : (
                  <span className={`${styles.bdValue} ${field.mono ? styles.bdValueMono : ""}`}>
                    {field.value.split("\n").map((line, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static list
                      <span key={i} className={styles.bdValueLine}>{line}</span>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tax & compliance */}
        <div className={styles.card}>
          <div className={styles.bdHeader}>
            <h2 className={styles.sectionTitle}>Tax &amp; compliance</h2>
          </div>
          <div className={styles.taxItems}>
            {TAX_ITEMS.map((item) => (
              <div key={item.title} className={styles.taxRow}>
                <span className={styles.taxIcon}>
                  {item.icon === "check" && <TaxCheckIcon />}
                  {item.icon === "card" && <TaxCardIcon />}
                  {item.icon === "globe" && <TaxGlobeIcon />}
                </span>
                <div className={styles.taxInfo}>
                  <span className={styles.taxTitle}>{item.title}</span>
                  <span className={styles.taxDetail}>
                    {item.detailLink ? (
                      <>
                        Switch currency in{" "}
                        <a href="/billing" className={styles.taxLink}>billing details</a>
                      </>
                    ) : (
                      item.detail
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1.5" y="5.5" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3.5 5.5V4a2.5 2.5 0 015 0v1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopySmIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 2H11a1 1 0 011 1v7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ExternalSmIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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

function TaxCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#10b981" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TaxCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" stroke="#6366f1" strokeWidth="1.2" />
      <path d="M1 6.5h14" stroke="#6366f1" strokeWidth="1.2" />
    </svg>
  );
}

function TaxGlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#6b7280" strokeWidth="1.2" />
      <path d="M8 1c-2 2-3 4-3 7s1 5 3 7M8 1c2 2 3 4 3 7s-1 5-3 7M1 8h14" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
