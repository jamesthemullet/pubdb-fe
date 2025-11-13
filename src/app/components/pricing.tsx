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

  console.log(11.01, userTier);

  const [estimateLoading, setEstimateLoading] = useState(false);
  const [performingUpgrade, setPerformingUpgrade] = useState(false);
  const [apiKey, setApiKey] = useState<any>(null);

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

  const modalUpcoming = upgradeModal?.upcoming;
  const modalProrationItems = modalUpcoming
    ? getProrationItems(modalUpcoming)
    : [];

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
      if (data.needsCheckout) {
        await subscribe(priceId, tierName);
        return;
      }
      setUpgradeModal({
        priceId,
        upcoming: data.upcoming || data,
        tierName,
      });
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
    console.log(101, tier);
    // const tierKey = tierNameToKey[tier.name] || null;
    // const hasThis = userTiers && tierKey && userTiers.has(tierKey);
    // if (hasThis) {
    //   window.location.href = "/";
    //   return;
    // }
    // if (tier.name === "Hobby") {
    //   const token = localStorage.getItem("token");
    //   if (!token) {
    //     alert("Please log in to manage subscriptions");
    //     window.location.href = "/register";
    //     return;
    //   }
    //   try {
    //     const apiUrl =
    //       process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    //     const response = await fetch(`${apiUrl}/payments/subscribe-to-hobby`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${token}`,
    //       },
    //     });
    //     if (!response.ok) {
    //       const errorData = await response.json().catch(() => ({}));
    //       throw new Error(
    //         errorData.message ||
    //           errorData.error ||
    //           "Failed to subscribe to Hobby tier"
    //       );
    //     }
    //     const data = await response.json();
    //     setUserTiers(new Set([...(userTiers || []), "HOBBY"]));
    //     setUserHighestTier("TESTING");
    //     setUpgradeModal({
    //       priceId: "",
    //       upcoming: null,
    //       tierName: "Hobby",
    //     });
    //     setApiKey(data.apiKey);
    //   } catch (error) {
    //     console.error("Hobby subscription error:", error);
    //     alert(
    //       error instanceof Error
    //         ? error.message
    //         : "Failed to subscribe to Hobby tier"
    //     );
    //   }
    //   return;
    // }
    // const token = localStorage.getItem("token");
    // if (!token) {
    //   alert("Please log in to manage subscriptions");
    //   window.location.href = "/register";
    //   return;
    // }
    // if (tier.priceId) {
    //   if (userHighestTier) {
    //     const userTierIndex = tierOrder.indexOf(userHighestTier);
    //     const thisTierIndex = tierOrder.indexOf(tierNameToKey[tier.name] || "");
    //     if (thisTierIndex > userTierIndex) {
    //       await requestUpgradeEstimate(tier.priceId, tier.name);
    //       return;
    //     }
    //   }
    //   subscribe(tier.priceId, tier.name);
    // }
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
              width: 480,
              maxWidth: "95%",
            }}
          >
            <h3>{"Subscription change details"}</h3>
            {apiKey && (
              <div style={{ marginTop: "1rem" }}>
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
          const actionLabel = (() => {
            if (userTierIndex === tier.index) return "Current plan";
            if (userTierIndex !== undefined && tier.index > userTierIndex)
              return `Upgrade to ${tier.name.toLowerCase()}`;
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
                    disabled={userTierIndex === tier.index}
                  >
                    {loadingTier === tier.name ? "Processing..." : actionLabel}
                  </button>
                ) : (
                  <button
                    onClick={() => handleTierSelection(tier)}
                    disabled={userTierIndex === tier.index}
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
