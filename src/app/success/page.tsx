"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type SubscriptionStatus = {
  success: boolean;
  message: string;
  subscription?: {
    id: string;
    status: string;
    tier: string;
    current_period_end: string;
  };
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
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

        // Trigger auth refresh to update dashboard
        window.dispatchEvent(new Event("authChanged"));
      } catch (error) {
        console.error("Session verification error:", error);
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
            <button>Return to Home</button>
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
            <button>Return to Home</button>
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
                <strong>Next billing:</strong>{" "}
                {new Date(
                  status.subscription.current_period_end
                ).toLocaleDateString()}
              </p>
              <p>
                <strong>Subscription ID:</strong> {status.subscription.id}
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
              <button style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
                View Dashboard
              </button>
            </Link>
            <Link href="/api-docs">
              <button
                style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}
                className="secondary"
              >
                API Documentation
              </button>
            </Link>
          </div>

          <div
            style={{
              marginTop: "3rem",
              padding: "1.5rem",
              backgroundColor: "#e8f4fd",
              borderRadius: "8px",
            }}
          >
            <h4>What's Next?</h4>
            <ul
              style={{ textAlign: "left", maxWidth: "400px", margin: "0 auto" }}
            >
              <li>Check your dashboard for your new API limits</li>
              <li>Generate or upgrade your API keys</li>
              <li>Start making API calls with your enhanced tier</li>
              <li>Review the API documentation for advanced features</li>
            </ul>
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
              <button>Try Again</button>
            </Link>
            <a href="mailto:support@thepubdb.com">
              <button className="secondary">Contact Support</button>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Suspense
        fallback={
          <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
        }
      >
        <SuccessContent />
      </Suspense>
    </>
  );
}
