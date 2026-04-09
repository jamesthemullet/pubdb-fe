"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/apiUrl";

type SubscriptionStatus = {
  success: boolean;
  message: string;
  subscription: {
    subscriptionId: string;
    status: string;
    tier: string;
    billingDay: number;
  };
  apiKey: {
    key?: string;
    keyPrefix?: string;
  };
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
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

  function formatBillingDay(billingDay: number): string {
    if (billingDay >= 29) {
      return `${billingDay}${getOrdinalSuffix(
        billingDay
      )} (or last day of month)`;
    }
    return `${billingDay}${getOrdinalSuffix(billingDay)}`;
  }

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        const apiUrl = API_BASE_URL;
        const token = localStorage.getItem("token");

        const response = await fetch(`${apiUrl}/payments/verify-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || errorData.error || "Failed to verify session"
          );
        }

        const data = await response.json();
        setStatus(data);

        window.dispatchEvent(new Event("authChanged"));
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to verify subscription"
        );
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Verifying your subscription...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2 style={{ color: "red" }}>Verification Failed</h2>
        <p>{error}</p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/">
            <button type="button">Return to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>No subscription data found</h2>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/">
            <button type="button">Return to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: "center",
        padding: "4rem",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {status.success ? (
        <>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
          <h2 style={{ color: "green", marginBottom: "1rem" }}>
            Subscription Successful!
          </h2>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
            {status.message}
          </p>

          {status.subscription && (
            <div
              style={{
                backgroundColor: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "2rem",
                marginBottom: "2rem",
                textAlign: "left",
                width: "600px",
              }}
            >
              <h3>Subscription Details</h3>
              <p>
                <strong>Plan:</strong> {status.subscription.tier}
              </p>
              <p>
                <strong>Status:</strong> {status.subscription.status}
              </p>
              <p>
                <strong>Billing Date:</strong>{" "}
                {formatBillingDay(status.subscription.billingDay)} of each month
              </p>
              <p>
                <strong>Subscription ID:</strong>{" "}
                {status.subscription.subscriptionId}
              </p>
              <p>
                <strong>API key:</strong>{" "}
                {status.apiKey.key ||
                  `Api key remains unchanged - ${status.apiKey.keyPrefix}`}
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/">
              <button type="button" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
                View Dashboard
              </button>
            </Link>
            {/* <Link href="/api-docs">
              <button
                style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}
                className="secondary"
              >
                API Documentation
              </button>
            </Link> */}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>❌</div>
          <h2 style={{ color: "red", marginBottom: "1rem" }}>
            Subscription Failed
          </h2>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
            {status.message}
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/">
              <button type="button">Try Again</button>
            </Link>
            <a href="mailto:support@thepubdb.com">
              <button type="button" className="secondary">Contact Support</button>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
        fallback={
          <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
        }
      >
        <SuccessContent />
      </Suspense>
  );
}
