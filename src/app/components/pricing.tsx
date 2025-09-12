import React from "react";

const pricingTiers = [
  {
    name: "Testing",
    price: "Free",
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
    features: [
      "5,000 requests/hour",
      "50,000 requests/day",
      "500,000 requests/month",
      "All features unlocked",
    ],
  },
];

const Pricing: React.FC = () => (
  <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
    {pricingTiers.map((tier) => (
      <div
        key={tier.name}
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "2rem",
          minWidth: "220px",
          textAlign: "center",
        }}
      >
        <h2>{tier.name}</h2>
        <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{tier.price}</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tier.features.map((feature) => (
            <li key={feature} style={{ margin: "0.5rem 0" }}>
              {feature}
            </li>
          ))}
        </ul>
        <button style={{ marginTop: "1rem", padding: "0.5rem 1.5rem" }}>
          Choose {tier.name}
        </button>
      </div>
    ))}
  </div>
);

export default Pricing;
