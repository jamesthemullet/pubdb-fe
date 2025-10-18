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
  }>(null);

  console.log(40, upgradeModal);

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
    return (n / 100).toFixed(2);
  }

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
      // ignore
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
        const errorData = await response.json();
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

  // Ask server for an upgrade estimate (proration)
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

      setUpgradeModal({ priceId, upcoming: data.upcoming || data, tierName });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to estimate upgrade");
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
      // if this is an upgrade (higher index), call upgrade estimate flow
      if (userHighestTier) {
        const userTierIndex = tierOrder.indexOf(userHighestTier);
        const thisTierIndex = tierOrder.indexOf(tierNameToKey[tier.name] || "");
        if (thisTierIndex > userTierIndex) {
          // upgrade path: estimate then either checkout or show proration
          await requestUpgradeEstimate(tier.priceId, tier.name);
          return;
        }
      }

      // default subscription flow (new subscription or downgrade)
      subscribe(tier.priceId, tier.name);
    }
  }

  return (
    <div>
      {/* Upgrade estimate modal */}
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
            <h3>Proration summary</h3>
            <div style={{ margin: "1rem 0" }}>
              <div>
                <strong>
                  Amount due on{" "}
                  {formatUnix(upgradeModal.upcoming.nextPaymentAttempt)}:
                </strong>{" "}
                ${formatMoney(upgradeModal.upcoming.estimatedAmount)}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Breakdown:</strong>
                <ul>
                  {(upgradeModal.upcoming?.raw.lines.data || []).map(
                    (ln: any, idx: number) => (
                      <li key={idx}>
                        {ln.description ?? JSON.stringify(ln)}: $
                        {formatMoney(ln.amount ?? 0)}
                      </li>
                    )
                  )}
                </ul>
              </div>
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
                onClick={() => performUpgrade(upgradeModal.priceId)}
                disabled={performingUpgrade}
                style={{ background: "#0070f3", color: "white" }}
              >
                {performingUpgrade ? "Processing..." : "Confirm upgrade"}
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
            if (!userTiers) return null; // Still loading user data
            if (hasThis) return "Current plan";
            if (userHighestTier) {
              if (thisTierIndex > userTierIndex)
                return `Upgrade to ${tier.name}`;
              if (thisTierIndex < userTierIndex)
                return `Downgrade to ${tier.name}`;
            }
            return null; // Default to subscribe logic
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
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  margin: "1rem 0",
                }}
              >
                {tier.price}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0" }}>
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}
                  >
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleTierSelection(tier)}
                disabled={loadingTier === tier.name || estimateLoading}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  width: "100%",
                  backgroundColor:
                    tier.name === "Developer" ? "#0070f3" : undefined,
                  color: tier.name === "Developer" ? "white" : undefined,
                  opacity: loadingTier === tier.name ? 0.7 : 1,
                  cursor: loadingTier === tier.name ? "not-allowed" : "pointer",
                }}
              >
                {loadingTier === tier.name || estimateLoading
                  ? "Loading..."
                  : actionLabel
                  ? actionLabel
                  : tier.name === "Testing"
                  ? "Get Started Free"
                  : `Subscribe to ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
