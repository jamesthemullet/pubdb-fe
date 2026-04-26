"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "./pricing.module.css";

type ProrationItem = {
  id?: string;
  description?: string;
  amount?: number;
  amount_excluding_tax?: number;
  currency?: string;
};

type InvoiceLike = {
  lines?: ProrationItem[];
  amount_due?: number;
  amount_remaining?: number;
  currency?: string;
  next_payment_attempt?: number;
  period_end?: number;
  current_period_end?: number;
};

type UpcomingBill = {
  proration?: ProrationItem[];
  proration_lines?: ProrationItem[];
  lines?: ProrationItem[];
  invoice?: InvoiceLike;
  latest_invoice?: Omit<InvoiceLike, "lines">;
  amount_due?: number;
  amount_remaining?: number;
  estimatedAmount?: number;
  nextPeriodCharge?: number;
  prorationOnlyCharge?: number;
  proratedCharge?: number;
  nextPaymentAttempt?: number;
  next_payment_attempt?: number;
  period_end?: number;
  current_period_end?: number;
  currency?: string;
  needsCheckout?: boolean;
};

type ApiKey = {
  name: string;
  keyPrefix: string;
  tier: string;
  keyStatus: string;
  permissions: string[];
  key: string;
};

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
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const setError = (text: string) =>
    setFeedbackMessage({ type: "error", text });

  const [userTier, setUserTier] = useState<string | null>(null);
  const [_userHighestTier, _setUserHighestTier] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<null | {
    priceId: string;
    upcoming: UpcomingBill | null;
    tierName: string;
  }>(null);

  const [_estimateLoading, setEstimateLoading] = useState(false);
  const [performingUpgrade, setPerformingUpgrade] = useState(false);
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const upgradeModalRef = useRef<HTMLDivElement>(null);
  const upgradeModalTriggerRef = useRef<HTMLElement | null>(null);

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

  const getProrationItems = (
    upcoming: UpcomingBill | null | undefined
  ): ProrationItem[] => {
    if (!upcoming) return [];
    return (
      upcoming.proration ||
      upcoming.proration_lines ||
      upcoming.lines ||
      upcoming.invoice?.lines ||
      []
    );
  };

  const getInvoiceLike = (upcoming: UpcomingBill | null | undefined) => {
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
  };

  const firstNumber = (...values: Array<number | null | undefined>) => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return undefined;
  };

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
  const upcomingBillCharge = firstNumber(
    modalUpcoming?.proratedCharge,
    modalUpcoming?.estimatedAmount
  );
  const inferredProrationAddedToNextBill =
    typeof estimatedDueNow !== "number" &&
    typeof nextPeriodCharge === "number" &&
    typeof prorationOnlyCharge === "number" &&
    typeof modalUpcoming?.estimatedAmount === "number" &&
    modalUpcoming.estimatedAmount === nextPeriodCharge + prorationOnlyCharge;

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

  const fetchUserTier = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/dashboard`, {
        headers: buildAuthHeaders(token),
      });
      if (!res.ok) return;
      const data = await res.json();

      setUserTier(data.apiKeys[0].tier);
    } catch (_err) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchUserTier();
  }, [fetchUserTier]);

  const subscribe = async (priceId: string, tierName: string) => {
    if (!priceId) return;
    setLoadingTier(tierName);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
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
      setFeedbackMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to start checkout process",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const requestUpgradeEstimate = async (priceId: string, tierName: string) => {
    setEstimateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/upgrade-estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
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
      setApiKey(data.apiKey);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to estimate upgrade"
      );
    } finally {
      setEstimateLoading(false);
    }
  };

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModal(null);
    upgradeModalTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (upgradeModal) {
      upgradeModalTriggerRef.current = document.activeElement as HTMLElement;
      const focusable = upgradeModalRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [upgradeModal]);

  function handleUpgradeModalKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      closeUpgradeModal();
      return;
    }
    if (e.key !== "Tab" || !upgradeModalRef.current) return;
    const focusableElements = Array.from(
      upgradeModalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  const performUpgrade = async (priceId: string) => {
    setPerformingUpgrade(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/perform-upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to perform upgrade");
      }
      await fetchUserTier();
      closeUpgradeModal();
      setFeedbackMessage({ type: "success", text: "Upgrade successful" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setPerformingUpgrade(false);
    }
  };

  const handleTierSelection = async (tier: (typeof pricingTiers)[0]) => {
    const token = localStorage.getItem("token");
    if (tier.name === userTier) {
      window.location.href = "/";
      return;
    }
    if (tier.name === "HOBBY") {
      if (!token) {
        setError("Please log in to manage subscriptions");
        window.location.href = "/register";
        return;
      }
      try {
        const response = await fetch(`${API_URL}/payments/subscribe-to-hobby`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
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
        setUserTier("HOBBY");
        setUpgradeModal({
          priceId: "",
          upcoming: null,
          tierName: "Hobby",
        });
        setApiKey(data.apiKey);
      } catch (error) {
        setFeedbackMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to subscribe to Hobby tier",
        });
      }
      return;
    }
    if (!token) {
      setError("Please log in to manage subscriptions");
      window.location.href = "/register";
      return;
    }
    if (tier.priceId) {
      await requestUpgradeEstimate(tier.priceId, tier.name);
    }
  };

  return (
    <div>
      {feedbackMessage && (
        <div
          aria-live="polite"
          className={`${styles.feedbackBanner} ${
            feedbackMessage.type === "success"
              ? styles.feedbackBannerSuccess
              : styles.feedbackBannerError
          }`}
        >
          {feedbackMessage.text}
          <Button
            onClick={() => setFeedbackMessage(null)}
            className={styles.feedbackBannerDismiss}
            variant="secondary"
            size="sm"
            aria-label="Dismiss"
          >
            ×
          </Button>
        </div>
      )}
      {upgradeModal ? (
        <div className={styles.modalOverlay}>
          <div
            ref={upgradeModalRef}
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-modal-title"
            onKeyDown={handleUpgradeModalKeyDown}
          >
            <Typography variant="headingSmall" id="upgrade-modal-title">Subscription details</Typography>
            {apiKey && (
              <div className={styles.modalSection}>
                <Typography variant="headingSmall" as="h4">
                  API Key Details
                </Typography>
                <Typography>
                  <strong>Name:</strong> {apiKey.name}
                </Typography>
                <Typography>
                  <strong>Key Prefix:</strong> {apiKey.keyPrefix}
                </Typography>
                <Typography>
                  <strong>Tier:</strong> {apiKey.tier}
                </Typography>
                <Typography>
                  <strong>Status:</strong> {apiKey.keyStatus}
                </Typography>
                <Typography>
                  <strong>Permissions:</strong> {apiKey.permissions.join(", ")}
                </Typography>
                <Typography>
                  <strong>API Key:</strong> {apiKey.key}
                </Typography>
              </div>
            )}
            {modalUpcoming ? (
              <div className={styles.modalSection}>
                <Typography variant="headingSmall" as="h4">
                  Estimated charges
                </Typography>
                {typeof estimatedDueNow === "number" ? (
                  <Typography>
                    <strong>Due now:</strong>{" "}
                    {formatCurrency(estimatedDueNow, estimateCurrency)}
                  </Typography>
                ) : inferredProrationAddedToNextBill ? (
                  <Typography className={styles.mutedText}>
                    No immediate charge. The mid-cycle adjustment will be added
                    to your next bill.
                  </Typography>
                ) : (
                  <Typography className={styles.mutedText}>
                    We could not determine your immediate charge. You can
                    continue to checkout to view the final amount.
                  </Typography>
                )}
                {typeof nextPeriodCharge === "number" ? (
                  <Typography>
                    <strong>Normal bill:</strong>{" "}
                    {formatCurrency(nextPeriodCharge, estimateCurrency)}
                  </Typography>
                ) : null}
                {typeof upcomingBillCharge === "number" ? (
                  <Typography>
                    <strong>Upcoming bill (with adjustment):</strong>{" "}
                    {formatCurrency(upcomingBillCharge, estimateCurrency)}
                  </Typography>
                ) : null}
                {nextPaymentDisplay ? (
                  <Typography>
                    <strong>Next payment:</strong> {nextPaymentDisplay}
                  </Typography>
                ) : null}
                {modalProrationItems.length ? (
                  <div>
                    <strong>Breakdown:</strong>
                    <ul className={styles.breakdownList}>
                      {modalProrationItems.map((item, index) => (
                        <li key={item.id || index}>
                          {(item.description || "Adjustment").trim()} {" - "}
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
              <div className={styles.confirmUpgradeRow}>
                <Button
                  onClick={() => performUpgrade(upgradeModal.priceId)}
                  disabled={performingUpgrade}
                >
                  {performingUpgrade
                    ? "Upgrading..."
                    : `Confirm upgrade to ${upgradeModal.tierName}`}
                </Button>
              </div>
            ) : null}
            <div className={styles.modalActions}>
              <Button
                onClick={closeUpgradeModal}
                disabled={performingUpgrade}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Typography variant="headingMedium" as="h1" className={styles.pricingHeading}>
        API Pricing
      </Typography>

      <div className={styles.tierCards}>
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
            <div key={tier.name} className={styles.tierCard}>
              <Typography variant="headingSmall">{tier.name}</Typography>
              <Typography className={styles.tierPrice}>{tier.price}</Typography>
              <ul className={styles.tierFeatures}>
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className={styles.tierAction}>
                {actionLabel ? (
                  <Button
                    onClick={() => handleTierSelection(tier)}
                    disabled={isCurrentTier || isLowerTier}
                    variant={isLowerTier ? "secondary" : "primary"}
                  >
                    {loadingTier === tier.name ? "Processing..." : actionLabel}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleTierSelection(tier)}
                    disabled={isCurrentTier || isLowerTier}
                  >
                    Subscribe
                  </Button>
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
