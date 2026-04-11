"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "./page.module.css";

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
        const apiUrl = API_URL;
        const token = localStorage.getItem("token");

        const response = await fetch(`${apiUrl}/payments/verify-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
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
      <div className={styles.centered}>
        <h2>Verifying your subscription...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <h2 className={styles.subheading}>Verification Failed</h2>
        <p>{error}</p>
        <div className={styles.actionLink}>
          <Link href="/">
            <button type="button">Return to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={styles.centered}>
        <h2>No subscription data found</h2>
        <div className={styles.actionLink}>
          <Link href="/">
            <button type="button">Return to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {status.success ? (
        <>
          <div className={styles.icon}>🎉</div>
          <h2 className={styles.headingSuccess}>Subscription Successful!</h2>
          <p className={styles.message}>{status.message}</p>

          {status.subscription && (
            <div className={styles.subscriptionDetails}>
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

          <div className={styles.actions}>
            <Link href="/">
              <button type="button">View Dashboard</button>
            </Link>
            {/* <Link href="/api-docs">
              <button type="button" className="secondary">
                API Documentation
              </button>
            </Link> */}
          </div>
        </>
      ) : (
        <>
          <div className={styles.icon}>❌</div>
          <h2 className={styles.headingError}>Subscription Failed</h2>
          <p className={styles.message}>{status.message}</p>

          <div className={styles.actions}>
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
        <div className={styles.centered}>Loading...</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
