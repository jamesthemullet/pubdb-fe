import React, { useEffect, useState } from "react";

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

  const [userTier, setUserTier] = useState<string | null>(null);
  const [userHighestTier, setUserHighestTier] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<null | {
    priceId: string;
    upcoming: any;
    tierName: string;
  }>(null);

  console.log(31, upgradeModal);

  const [estimateLoading, setEstimateLoading] = useState(false);
  const [performingUpgrade, setPerformingUpgrade] = useState(false);
  const [apiKey, setApiKey] = useState<any>(null);

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

  function getProrationItems(upcoming: any) {
    if (!upcoming) return [];
    return (
      upcoming.proration ||
      upcoming.proration_lines ||
      upcoming.lines ||
      (upcoming.invoice && upcoming.invoice.lines) ||
      []
    );
  }

  function getInvoiceLike(upcoming: any) {
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
    modalUpcoming?.estimatedAmount,
    modalUpcoming?.proratedCharge,
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

  async function fetchUserTier() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/auth/dashboard`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) return;
      const data = await res.json();

      console.log(11, data.apiKeys);

      setUserTier(data.apiKeys[0].tier);
    } catch (err) {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchUserTier();
  }, []);

  const subscribe = async (priceId: string, tierName: string) => {
    if (!priceId) return;
    setLoadingTier(tierName);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiUrl}/payments/create-checkout-session`,
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
      console.log(130, data);
      window.location.href = data.url;
    } catch (error) {
      console.error("Subscription error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to start checkout process"
      );
    } finally {
      setLoadingTier(null);
    }
  };

  const requestUpgradeEstimate = async (priceId: string, tierName: string) => {
    setEstimateLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/payments/upgrade-estimate`, {
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
      console.log(30, data);
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
      alert(err instanceof Error ? err.message : "Failed to estimate upgrade");
    } finally {
      setEstimateLoading(false);
    }
  };

  const performUpgrade = async (priceId: string) => {
    setPerformingUpgrade(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/payments/perform-upgrade`, {
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
      alert("Upgrade successful");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setPerformingUpgrade(false);
    }
  };

  const handleTierSelection = async (tier: (typeof pricingTiers)[0]) => {
    console.log(101, tier.name);
    console.log(102, userTier);
    const token = localStorage.getItem("token");
    if (tier.name === userTier) {
      window.location.href = "/";
      return;
    }
    if (tier.name === "HOBBY") {
      if (!token) {
        alert("Please log in to manage subscriptions");
        window.location.href = "/register";
        return;
      }
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/payments/subscribe-to-hobby`, {
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
        console.log(110, data);
        setUserTier("HOBBY");
        setUpgradeModal({
          priceId: "",
          upcoming: null,
          tierName: "Hobby",
        });
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Hobby subscription error:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to subscribe to Hobby tier"
        );
      }
      return;
    }
    if (!token) {
      alert("Please log in to manage subscriptions");
      window.location.href = "/register";
      return;
    }
    if (tier.priceId) {
      await requestUpgradeEstimate(tier.priceId, tier.name);
    }
  };

  return (
    <div>
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
                ) : (
                  <p style={{ color: "#666" }}>
                    We could not determine your immediate charge. You can
                    continue to checkout to view the final amount.
                  </p>
                )}
                {typeof nextPeriodCharge === "number" ? (
                  <p>
                    <strong>Next period charge:</strong>{" "}
                    {formatCurrency(nextPeriodCharge, estimateCurrency)}
                  </p>
                ) : null}
                {typeof prorationOnlyCharge === "number" &&
                typeof modalUpcoming?.prorationOnlyCharge === "number" ? (
                  <p>
                    <strong>Proration credit:</strong>{" "}
                    {formatCurrency(prorationOnlyCharge, estimateCurrency)}
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
                      {modalProrationItems.map((item: any, index: number) => (
                        <li key={item.id || index}>
                          {(item.description || "Proration").trim()} {" - "}
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
                    onClick={() => handleTierSelection(tier)}
                    disabled={isCurrentTier || isLowerTier}
                  >
                    {loadingTier === tier.name ? "Processing..." : actionLabel}
                  </button>
                ) : (
                  <button
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
