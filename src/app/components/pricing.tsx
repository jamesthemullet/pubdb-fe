import React, { useEffect, useState } from "react";

const pricingTiers = [
  {
    name: "Hobby",
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
    name: "Developer",
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
    name: "Business",
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
  const [userTiers, setUserTiers] = useState<Set<string> | null>(null);
  const [userHighestTier, setUserHighestTier] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<null | {
    priceId: string;
    upcoming: any;
    tierName: string;
    direction?: "upgrade" | "downgrade";
  }>(null);

  const [estimateLoading, setEstimateLoading] = useState(false);
  const [performingUpgrade, setPerformingUpgrade] = useState(false);

  function formatUnix(value: any) {
    if (!value && value !== 0) return "—";
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    const date = n > 1e12 ? new Date(n) : new Date(n * 1000);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatMoney(amount: any) {
    if (amount === null || amount === undefined) return "0.00";
    const n = Number(amount);
    if (Number.isNaN(n)) return String(amount);
    const dollars = Math.abs(n) >= 100 ? n / 100 : n;
    return dollars.toFixed(2);
  }

  function tierKeyToDisplay(key?: string | null) {
    if (!key) return "Free";
    if (key === "TESTING") return "Hobby";
    if (key === "DEVELOPER") return "Developer";
    if (key === "BUSINESS") return "Business";
    return String(key);
  }

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

  function getTierPriceDisplay(tierName?: string) {
    if (!tierName) return null;
    const t = pricingTiers.find((p) => p.name === tierName);
    return t?.price || null;
  }

  const modalUpcoming = upgradeModal?.upcoming;
  const modalProrationItems = modalUpcoming
    ? getProrationItems(modalUpcoming)
    : [];

  const tierNameToKey: Record<string, string> = {
    Hobby: "TESTING",
    Testing: "TESTING",
    Developer: "DEVELOPER",
    Business: "BUSINESS",
  };
  const tierOrder = ["TESTING", "DEVELOPER", "BUSINESS"];

  async function fetchUserTiers() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/auth/dashboard`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) return;
      const data = await res.json();
      const tiers = new Set<string>();
      (data.apiKeys || []).forEach((k: any) => {
        if (k.tier) tiers.add(String(k.tier));
      });
      setUserTiers(tiers);
      for (const t of tierOrder.slice().reverse()) {
        if (tiers.has(t)) {
          setUserHighestTier(t);
          break;
        }
      }
    } catch (err) {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchUserTiers();
  }, []);

  async function subscribe(priceId: string, tierName: string) {
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
  }

  async function requestUpgradeEstimate(priceId: string, tierName: string) {
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
      if (data.needsCheckout) {
        await subscribe(priceId, tierName);
        return;
      }
      setUpgradeModal({
        priceId,
        upcoming: data.upcoming || data,
        tierName,
        direction: "upgrade",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to estimate upgrade");
    } finally {
      setEstimateLoading(false);
    }
  }

  async function requestDowngradeEstimate(priceId: string, tierName: string) {
    setEstimateLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/payments/downgrade-estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to get downgrade estimate");
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
        direction: "downgrade",
      });
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to estimate downgrade"
      );
    } finally {
      setEstimateLoading(false);
    }
  }

  async function performUpgrade(priceId: string) {
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
      await fetchUserTiers();
      setUpgradeModal(null);
      alert("Upgrade successful");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setPerformingUpgrade(false);
    }
  }

  async function performDowngrade(priceId: string) {
    setPerformingUpgrade(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/payments/perform-downgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to perform downgrade");
      }
      await fetchUserTiers();
      setUpgradeModal(null);
      alert("Downgrade successful");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Downgrade failed");
    } finally {
      setPerformingUpgrade(false);
    }
  }

  async function handleTierSelection(tier: (typeof pricingTiers)[0]) {
    const tierKey = tierNameToKey[tier.name] || null;
    const hasThis = userTiers && tierKey && userTiers.has(tierKey);
    if (hasThis) {
      window.location.href = "/";
      return;
    }
    if (tier.name === "Testing") {
      window.location.href = "/register";
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to manage subscriptions");
      window.location.href = "/register";
      return;
    }
    if (tier.priceId) {
      if (userHighestTier) {
        const userTierIndex = tierOrder.indexOf(userHighestTier);
        const thisTierIndex = tierOrder.indexOf(tierNameToKey[tier.name] || "");
        if (thisTierIndex > userTierIndex) {
          await requestUpgradeEstimate(tier.priceId, tier.name);
          return;
        }
        if (thisTierIndex < userTierIndex) {
          await requestDowngradeEstimate(tier.priceId, tier.name);
          return;
        }
      }
      subscribe(tier.priceId, tier.name);
    }
  }

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
              width: 480,
              maxWidth: "95%",
            }}
          >
            <h3>
              {upgradeModal.direction === "downgrade"
                ? "Downgrade details"
                : "Subscription change details"}
            </h3>

            {upgradeModal.direction === "upgrade" ? (
              <div style={{ margin: "1rem 0" }}>
                <h4 style={{ margin: "0 0 8px 0" }}>Proration summary</h4>
                {modalProrationItems && modalProrationItems.length > 0 ? (
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {modalProrationItems.map((it: any, i: number) => (
                      <li key={i}>
                        {(it.description && String(it.description)) ||
                          it.id ||
                          "Item"}{" "}
                        — $
                        {formatMoney(
                          it.amount ??
                            it.unit_amount ??
                            it.price ??
                            it.estimatedAmount ??
                            it.estimated_amount ??
                            0
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>
                    {modalUpcoming?.estimatedAmount ? (
                      <div>
                        <strong>Estimated immediate charge:</strong> $
                        {formatMoney(modalUpcoming.estimatedAmount)}
                      </div>
                    ) : null}
                    {modalUpcoming?.nextPeriodCharge ? (
                      <div>
                        <strong>Next period charge:</strong> $
                        {formatMoney(modalUpcoming.nextPeriodCharge)}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ margin: "1rem 0" }}>
                <h4 style={{ margin: "0 0 8px 0" }}>Downgrade details</h4>
                <div>
                  <strong>New plan:</strong> {upgradeModal.tierName}{" "}
                  {getTierPriceDisplay(upgradeModal.tierName)
                    ? `(${getTierPriceDisplay(upgradeModal.tierName)})`
                    : null}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Next period charge:</strong> $
                  {formatMoney(
                    modalUpcoming?.nextPeriodCharge ??
                      modalUpcoming?.estimatedAmount ??
                      0
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <em style={{ marginRight: 8, color: "#444" }}>
                (
                {userHighestTier
                  ? tierKeyToDisplay(userHighestTier)
                  : upgradeModal.tierName || "Free"}
                )
              </em>
              <strong>Subscription ends on:</strong>{" "}
              {formatUnix(upgradeModal.upcoming.nextPaymentAttempt)}
            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setUpgradeModal(null)}
                disabled={performingUpgrade}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  upgradeModal.direction === "downgrade"
                    ? performDowngrade(upgradeModal.priceId)
                    : performUpgrade(upgradeModal.priceId)
                }
                disabled={performingUpgrade}
                style={{ background: "#0070f3", color: "white" }}
              >
                {performingUpgrade
                  ? "Processing..."
                  : upgradeModal.direction === "downgrade"
                  ? "Confirm downgrade"
                  : "Confirm upgrade"}
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
          const tierKey = tierNameToKey[tier.name] || null;
          const hasThis = userTiers && tierKey && userTiers.has(tierKey);
          const userTierIndex = userHighestTier
            ? tierOrder.indexOf(userHighestTier)
            : -1;
          const thisTierIndex = tierKey ? tierOrder.indexOf(tierKey) : -1;
          const actionLabel = (() => {
            if (!userTiers) return null;
            if (hasThis) return "Current plan";
            if (userHighestTier) {
              if (thisTierIndex > userTierIndex)
                return `Upgrade to ${tier.name}`;
              if (thisTierIndex < userTierIndex)
                return `Downgrade to ${tier.name}`;
            }
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
                    disabled={loadingTier === tier.name}
                  >
                    {loadingTier === tier.name ? "Processing..." : actionLabel}
                  </button>
                ) : (
                  <button
                    onClick={() => handleTierSelection(tier)}
                    disabled={loadingTier === tier.name}
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
