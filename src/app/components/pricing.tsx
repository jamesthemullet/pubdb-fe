import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/apiUrl";
import styles from "./pricing.module.css";

const API_URL = API_BASE_URL;
type UpcomingBill = {
  proration?: Array<{
    id?: string;
    description?: string;
    amount?: number;
    amount_excluding_tax?: number;
    currency?: string;
  }>;
  proration_lines?: Array<{
    id?: string;
    description?: string;
    amount?: number;
    amount_excluding_tax?: number;
    currency?: string;
  }>;
  lines?: Array<{
    id?: string;
    description?: string;
    amount?: number;
    amount_excluding_tax?: number;
    currency?: string;
  }>;
  invoice?: {
    lines?: Array<{
      id?: string;
      description?: string;
      amount?: number;
      amount_excluding_tax?: number;
      currency?: string;
    }>;
    amount_due?: number;
    amount_remaining?: number;
    currency?: string;
    next_payment_attempt?: number;
    period_end?: number;
    current_period_end?: number;
  };
  latest_invoice?: {
    amount_due?: number;
    amount_remaining?: number;
    currency?: string;
    next_payment_attempt?: number;
    period_end?: number;
    current_period_end?: number;
  };
  amount_due?: number;
  amount_remaining?: number;
  estimatedAmount?: number;
  nextPeriodCharge?: number;
  prorationOnlyCharge?: number;
  proratedCharge?: number;
  nextPaymentAttempt?: number;
  next_payment_attempt?: number;
  period_end?: number;
  current_period_end?: number;
  currency?: string;
  needsCheckout?: boolean;
};

type ApiKey = {
  name: string;
  keyPrefix: string;
  tier: string;
  keyStatus: string;
  permissions: string[];
  key: string;
};

type ProrationItem = {
  id?: string;
  description?: string;
  amount?: number;
  amount_excluding_tax?: number;
  currency?: string;
};

const pricingTiers = [
  {
    index: 0,
    name: "HOBBY",
    price: "Free",
    priceId: null,
    features: [
      "20 requests/hour",
      "200 requests/day",
      "1,000 requests/month",
      "Basic features only",
    ],
  },
  {
    index: 1,
    name: "DEVELOPER",
    price: "$9/mo",
    priceId: "price_1S6cBZ0k31jD9MVaQH1JSrAl",
    features: [
      "1,000 requests/hour",
      "10,000 requests/day",
      "100,000 requests/month",
      "Advanced filtering and sorting",
    ],
  },
  {
    index: 2,
    name: "BUSINESS",
    price: "$19/mo",
    priceId: "price_1S6cBq0k31jD9MVaRYKvxRek",
    features: [
      "5,000 requests/hour",
      "50,000 requests/day",
      "500,000 requests/month",
      "All features unlocked",
    ],
  },
];

const Pricing: React.FC = () => {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const setError = (text: string) => setFeedbackMessage({ type: "error", text });

  const [userTier, setUserTier] = useState<string | null>(null);
  const [_userHighestTier, _setUserHighestTier] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<null | {
    priceId: string;
    upcoming: UpcomingBill | null;
    tierName: string;
  }>(null);

  const [_estimateLoading, setEstimateLoading] = useState(false);
  const [performingUpgrade, setPerformingUpgrade] = useState(false);
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);

  const formatCurrency = (amount?: number, currency: string = "usd") => {
    if (typeof amount !== "number") return "-";
    const normalizedCurrency = currency?.toUpperCase() || "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: normalizedCurrency,
      }).format(amount / 100);
    } catch {
      return `$${(amount / 100).toFixed(2)}`;
    }
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleString();
  };

  function getProrationItems(upcoming: UpcomingBill | null | undefined): ProrationItem[] {
    if (!upcoming) return [];
    return (
      upcoming.proration ||
      upcoming.proration_lines ||
      upcoming.lines ||
      upcoming.invoice?.lines ||
      []
    );
  }

  function getInvoiceLike(upcoming: UpcomingBill | null | undefined) {
    if (!upcoming) return null;
    if (typeof upcoming.amount_due === "number") return upcoming;
    if (upcoming.invoice && typeof upcoming.invoice.amount_due === "number")
      return upcoming.invoice;
    if (
      upcoming.latest_invoice &&
      typeof upcoming.latest_invoice.amount_due === "number"
    )
      return upcoming.latest_invoice;
    return null;
  }

  function firstNumber(...values: Array<number | null | undefined>) {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return undefined;
  }

  const modalUpcoming = upgradeModal?.upcoming;
  const modalProrationItems = modalUpcoming
    ? getProrationItems(modalUpcoming)
    : [];
  const modalInvoice = getInvoiceLike(modalUpcoming);
  const estimateCurrency =
    modalUpcoming?.currency ||
    modalInvoice?.currency ||
    modalProrationItems[0]?.currency ||
    "usd";
  const estimatedDueNow = firstNumber(
    modalInvoice?.amount_due,
    modalUpcoming?.amount_due
  );
  const nextPeriodCharge = firstNumber(
    modalUpcoming?.nextPeriodCharge,
    modalInvoice?.amount_remaining,
    modalUpcoming?.amount_remaining
  );
  const prorationOnlyCharge = firstNumber(
    modalUpcoming?.prorationOnlyCharge,
    modalUpcoming?.proratedCharge
  );
  const upcomingBillCharge = firstNumber(
    modalUpcoming?.proratedCharge,
    modalUpcoming?.estimatedAmount
  );
  const inferredProrationAddedToNextBill =
    typeof estimatedDueNow !== "number" &&
    typeof nextPeriodCharge === "number" &&
    typeof prorationOnlyCharge === "number" &&
    typeof modalUpcoming?.estimatedAmount === "number" &&
    modalUpcoming.estimatedAmount === nextPeriodCharge + prorationOnlyCharge;
  const nextPaymentTimestamp = firstNumber(
    modalUpcoming?.nextPaymentAttempt,
    modalInvoice?.next_payment_attempt,
    modalUpcoming?.next_payment_attempt,
    modalInvoice?.period_end,
    modalUpcoming?.period_end,
    modalInvoice?.current_period_end,
    modalUpcoming?.current_period_end
  );
  const nextPaymentDisplay = formatDateTime(nextPaymentTimestamp);

  const fetchUserTier = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/dashboard`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) return;
      const data = await res.json();

      setUserTier(data.apiKeys[0].tier);
    } catch (_err) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchUserTier();
  }, [fetchUserTier]);

  const subscribe = async (priceId: string, tierName: string) => {
    if (!priceId) return;
    setLoadingTier(tierName);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ priceId }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Failed to create checkout session"
        );
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      setFeedbackMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to start checkout process",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const requestUpgradeEstimate = async (priceId: string, tierName: string) => {
    setEstimateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/upgrade-estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to get upgrade estimate");
      }
      const data = await res.json();
      if (data.needsCheckout) {
        await subscribe(priceId, tierName);
        return;
      }
      setUpgradeModal({
        priceId,
        upcoming: data.upcoming || data,
        tierName,
      });
      setApiKey(data.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to estimate upgrade");
    } finally {
      setEstimateLoading(false);
    }
  };

  const performUpgrade = async (priceId: string) => {
    setPerformingUpgrade(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/perform-upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to perform upgrade");
      }
      await fetchUserTier();
      setUpgradeModal(null);
      setFeedbackMessage({ type: "success", text: "Upgrade successful" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setPerformingUpgrade(false);
    }
  };

  const handleTierSelection = async (tier: (typeof pricingTiers)[0]) => {
    const token = localStorage.getItem("token");
    if (tier.name === userTier) {
      window.location.href = "/";
      return;
    }
    if (tier.name === "HOBBY") {
      if (!token) {
        setError("Please log in to manage subscriptions");
        window.location.href = "/register";
        return;
      }
      try {
        const response = await fetch(`${API_URL}/payments/subscribe-to-hobby`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              errorData.error ||
              "Failed to subscribe to Hobby tier"
          );
        }
        const data = await response.json();
        setUserTier("HOBBY");
        setUpgradeModal({
          priceId: "",
          upcoming: null,
          tierName: "Hobby",
        });
        setApiKey(data.apiKey);
      } catch (error) {
        setFeedbackMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to subscribe to Hobby tier",
        });
      }
      return;
    }
    if (!token) {
      setError("Please log in to manage subscriptions");
      window.location.href = "/register";
      return;
    }
    if (tier.priceId) {
      await requestUpgradeEstimate(tier.priceId, tier.name);
    }
  };

  return (
    <div>
      {feedbackMessage && (
        <div
          className={`${styles.feedbackBanner} ${feedbackMessage.type === "success" ? styles.feedbackBannerSuccess : styles.feedbackBannerError}`}
        >
          {feedbackMessage.text}
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className={styles.feedbackBannerDismiss}
          >
            ×
          </button>
        </div>
      )}
      {upgradeModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: "95%",
              width: "600px",
            }}
          >
            <h3>{"Subscription details"}</h3>
            {apiKey && (
              <div style={{ margin: "1rem 0" }}>
                <h4>API Key Details</h4>
                <p>
                  <strong>Name:</strong> {apiKey.name}
                </p>
                <p>
                  <strong>Key Prefix:</strong> {apiKey.keyPrefix}
                </p>
                <p>
                  <strong>Tier:</strong> {apiKey.tier}
                </p>
                <p>
                  <strong>Status:</strong> {apiKey.keyStatus}
                </p>
                <p>
                  <strong>Permissions:</strong> {apiKey.permissions.join(", ")}
                </p>
                <p>
                  <strong>API Key:</strong> {apiKey.key}
                </p>
              </div>
            )}
            {modalUpcoming ? (
              <div style={{ margin: "1rem 0" }}>
                <h4>Estimated charges</h4>
                {typeof estimatedDueNow === "number" ? (
                  <p>
                    <strong>Due now:</strong>{" "}
                    {formatCurrency(estimatedDueNow, estimateCurrency)}
                  </p>
                ) : inferredProrationAddedToNextBill ? (
                  <p style={{ color: "#666" }}>
                    No immediate charge. The mid-cycle adjustment will be added
                    to your next bill.
                  </p>
                ) : (
                  <p style={{ color: "#666" }}>
                    We could not determine your immediate charge. You can
                    continue to checkout to view the final amount.
                  </p>
                )}
                {typeof nextPeriodCharge === "number" ? (
                  <p>
                    <strong>Normal bill:</strong>{" "}
                    {formatCurrency(nextPeriodCharge, estimateCurrency)}
                  </p>
                ) : null}
                {typeof upcomingBillCharge === "number" ? (
                  <p>
                    <strong>Upcoming bill (with adjustment):</strong>{" "}
                    {formatCurrency(upcomingBillCharge, estimateCurrency)}
                  </p>
                ) : null}
                {nextPaymentDisplay ? (
                  <p>
                    <strong>Next payment:</strong> {nextPaymentDisplay}
                  </p>
                ) : null}
                {modalProrationItems.length ? (
                  <div>
                    <strong>Breakdown:</strong>
                    <ul style={{ paddingLeft: 16 }}>
                      {modalProrationItems.map((item, index) => (
                        <li key={item.id || index}>
                          {(item.description || "Adjustment").trim()} {" - "}
                          {formatCurrency(
                            typeof item.amount === "number"
                              ? item.amount
                              : item.amount_excluding_tax,
                            item.currency || modalUpcoming.currency
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            {upgradeModal?.priceId ? (
              <div
                style={{
                  margin: "1.5rem 0",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => performUpgrade(upgradeModal.priceId)}
                  disabled={performingUpgrade}
                >
                  {performingUpgrade
                    ? "Upgrading..."
                    : `Confirm upgrade to ${upgradeModal.tierName}`}
                </button>
              </div>
            ) : null}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={() => setUpgradeModal(null)}
                disabled={performingUpgrade}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>API Pricing</h2>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {pricingTiers.map((tier) => {
          const userTierIndex = pricingTiers.find(
            (tier) => tier.name === userTier
          )?.index;
          const isCurrentTier = userTierIndex === tier.index;
          const isLowerTier =
            userTierIndex !== undefined && tier.index < userTierIndex;
          const isHigherTier =
            userTierIndex !== undefined && tier.index > userTierIndex;
          const actionLabel = (() => {
            if (isCurrentTier) return "Current plan";
            if (isHigherTier) return `Upgrade to ${tier.name.toLowerCase()}`;
            if (isLowerTier) return "Contact support to downgrade";
            return null;
          })();

          return (
            <div
              key={tier.name}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "2rem",
                minWidth: "220px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <h3>{tier.name}</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
                {tier.price}
              </p>
              <ul style={{ textAlign: "left", paddingLeft: 16 }}>
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div style={{ marginTop: 12 }}>
                {actionLabel ? (
                  <button
                    type="button"
                    onClick={() => handleTierSelection(tier)}
                    disabled={isCurrentTier || isLowerTier}
                  >
                    {loadingTier === tier.name ? "Processing..." : actionLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTierSelection(tier)}
                    disabled={isCurrentTier || isLowerTier}
                  >
                    Subscribe
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
