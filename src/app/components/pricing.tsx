import React, { useState } from "react";

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

  async function subscribe(priceId: string, tierName: string) {
    if (!priceId) return; // Free tier doesn't need checkout

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

  function handleTierSelection(tier: (typeof pricingTiers)[0]) {
    if (tier.name === "Hobby") {
      window.location.href = "/register";
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to subscribe to a paid plan");
      window.location.href = "/register";
      return;
    }

    if (tier.priceId) {
      subscribe(tier.priceId, tier.name);
    }
  }

  return (
    <div>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>API Pricing</h2>
      <div
        style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {pricingTiers.map((tier) => (
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
              style={{ fontSize: "2rem", fontWeight: "bold", margin: "1rem 0" }}
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
              disabled={loadingTier === tier.name}
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
              {loadingTier === tier.name
                ? "Loading..."
                : tier.name === "Hobby"
                ? "Get Started Free"
                : `Subscribe to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
