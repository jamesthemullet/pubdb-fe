"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { ReactElement } from "react";
import Typography from "@/app/components/typography/typography";
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

function SuccessContent(): ReactElement {
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
        <Typography variant="headingMedium">Verifying your subscription...</Typography>
        <Typography>Please wait while we confirm your payment.</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <Typography variant="headingMedium" className={styles.subheading}>Verification Failed</Typography>
        <Typography>{error}</Typography>
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
        <Typography variant="headingMedium">No subscription data found</Typography>
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
          <div className={styles.icon} aria-hidden="true">🎉</div>
          <Typography variant="headingMedium" className={styles.headingSuccess}>Subscription Successful!</Typography>
          <Typography className={styles.message}>{status.message}</Typography>

          {status.subscription && (
            <div className={styles.subscriptionDetails}>
              <Typography variant="headingSmall">Subscription Details</Typography>
              <Typography>
                <strong>Plan:</strong> {status.subscription.tier}
              </Typography>
              <Typography>
                <strong>Status:</strong> {status.subscription.status}
              </Typography>
              <Typography>
                <strong>Billing Date:</strong>{" "}
                {formatBillingDay(status.subscription.billingDay)} of each month
              </Typography>
              <Typography>
                <strong>Subscription ID:</strong>{" "}
                {status.subscription.subscriptionId}
              </Typography>
              <Typography>
                <strong>API key:</strong>{" "}
                {status.apiKey.key ||
                  `Api key remains unchanged - ${status.apiKey.keyPrefix}`}
              </Typography>
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
          <div className={styles.icon} aria-hidden="true">❌</div>
          <Typography variant="headingMedium" className={styles.headingError}>Subscription Failed</Typography>
          <Typography className={styles.message}>{status.message}</Typography>

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

export default function SuccessPage(): ReactElement {
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
