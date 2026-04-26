"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import { getErrorMessage, isHttpErrorObject } from "@/lib/errors";
import Button from "../../components/button/button";
import Typography from "../../components/typography/typography";
import styles from "./dashboard.module.css";

type ApiKey = {
  name: string;
  tier: string;
  keyPrefix: string;
  isActive: boolean;
  keyStatus?: string;
  status?: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  remaining: {
    hour: number;
    day: number;
    month: number;
  };
  limits: {
    requestsPerHour: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  resetTimes: {
    hour: string;
    day: string;
    month: string;
  };
  features: {
    allowLocationSearch: boolean;
    allowStats: boolean;
  };
};

type GeneratedApiKeyResponse = {
  name?: string;
  keyPrefix?: string;
  tier?: string;
  keyStatus?: string;
  permissions?: string[];
  key?: string;
};

type DashboardData = {
  user: {
    name: string;
    username: string;
    email: string;
    approved: boolean;
    emailVerified: boolean;
  };
  apiKeys: ApiKey[];
  summary: {
    totalApiKeys: number;
    totalUsage: number;
  };
};

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [forgotKeyLoading, setForgotKeyLoading] = useState(false);
  const [forgotKeyMessage, setForgotKeyMessage] = useState<string | null>(null);
  const [forgotKeyError, setForgotKeyError] = useState<string | null>(null);
  const [forgotKeyTarget, setForgotKeyTarget] = useState<string | null>(null);
  const [forgotKeyDetails, setForgotKeyDetails] =
    useState<GeneratedApiKeyResponse | null>(null);
  const [showForgotKeyModal, setShowForgotKeyModal] = useState(false);
  const [forgotKeyCopyStatus, setForgotKeyCopyStatus] = useState<
    "idle" | "copied" | "error"
  >("idle");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const apiUrl = API_URL;
        const token = localStorage.getItem("token");

        const res = await fetch(`${apiUrl}/auth/dashboard`, {
          headers: buildAuthHeaders(token),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw { response: res, data: errorData };
        }

        const data = await res.json();
        setDashboardData(data);
      } catch (error: unknown) {
        if (isHttpErrorObject(error)) {
          setError(
            error.data.message ||
              error.data.error ||
              `HTTP error! status: ${error.response.status}`
          );
        } else {
          setError(
            error instanceof Error ? error.message : "Failed to load dashboard"
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [isAuthenticated]);

  async function handleCancelSubscription() {
    if (
      !confirm(
        "Cancel subscription? This will stop automatic renewal — your subscription will remain active until the end of the current billing period."
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      setCancelError(null);
      setCancelMessage(null);

      const apiUrl = API_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/payments/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw data || new Error(`HTTP error ${res.status}`);
      }

      setCancelMessage(
        data.message ||
          "Subscription cancelled. It will expire at the end of the current billing period."
      );
      // refresh dashboard data
      setTimeout(() => window.dispatchEvent(new Event("authChanged")), 800);
    } catch (err: unknown) {
      setCancelError(getErrorMessage(err, "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  }

  async function handleForgotApiKey(keyPrefix: string) {
    const userEmail = dashboardData?.user.email;
    if (!userEmail) {
      setForgotKeyError("Unable to determine account email for this request.");
      return;
    }

    try {
      setForgotKeyLoading(true);
      setForgotKeyError(null);
      setForgotKeyMessage(null);
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
      setForgotKeyTarget(keyPrefix);

      const apiUrl = API_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/auth/forgot-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({ keyPrefix, email: userEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw data || new Error(`HTTP error ${res.status}`);
      }

      setForgotKeyMessage(
        data.message ||
          "If this API key is eligible, instructions have been emailed to the account owner."
      );
      if (data.apiKey) {
        setForgotKeyDetails({
          ...data.apiKey,
          keyPrefix: data.apiKey.keyPrefix || keyPrefix,
        });
        setShowForgotKeyModal(true);
        setForgotKeyCopyStatus("idle");
      }
    } catch (err: unknown) {
      setForgotKeyError(getErrorMessage(err, "Failed to request API key reminder"));
      setForgotKeyDetails(null);
      setShowForgotKeyModal(false);
      setForgotKeyCopyStatus("idle");
    } finally {
      setForgotKeyLoading(false);
    }
  }

  async function handleCopyNewApiKey() {
    if (!forgotKeyDetails?.key) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(forgotKeyDetails.key);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setForgotKeyCopyStatus("copied");
      setTimeout(() => setForgotKeyCopyStatus("idle"), 2000);
    } catch (_err) {
      setForgotKeyCopyStatus("error");
    }
  }

  function handleCloseForgotKeyModal() {
    setShowForgotKeyModal(false);
    setForgotKeyDetails(null);
    setForgotKeyCopyStatus("idle");
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Typography variant="bodyMedium">Loading dashboard...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Typography variant="bodyMedium">
          Error loading dashboard: {error}
        </Typography>
        <Button variant="primary" onClick={() => window.location.reload()}>
          <Typography as="span" variant="bodySmall">
            Try Again
          </Typography>
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const formatUsagePercentage = (used: number, limit: number) => {
    const remaining = limit - used;
    const percentage = ((used / limit) * 100).toFixed(1);
    return { remaining, percentage, used };
  };

  return (
    <>
      {forgotKeyDetails && showForgotKeyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <Typography variant="headingSmall">
              New API key generated
            </Typography>
            <Typography variant="bodySmall" className={styles.modalDescription}>
              This key is shown only once. Copy it now and store it securely.
            </Typography>
            <Typography variant="bodySmall" className={styles.fieldRow}>
              Name: {forgotKeyDetails.name || "Untitled key"}
            </Typography>
            <Typography variant="bodySmall" className={styles.fieldRow}>
              Tier: {forgotKeyDetails.tier || "—"}
            </Typography>
            <Typography variant="bodySmall" className={styles.fieldRow}>
              Status: {forgotKeyDetails.keyStatus || "—"}
            </Typography>
            <Typography variant="bodySmall" className={styles.fieldRow}>
              Key prefix: {forgotKeyDetails.keyPrefix || "—"}
            </Typography>
            {forgotKeyDetails.permissions?.length ? (
              <Typography variant="bodySmall" className={styles.fieldRow}>
                Permissions: {forgotKeyDetails.permissions.join(", ")}
              </Typography>
            ) : null}
            {forgotKeyDetails.key && (
              <div className={styles.modalKeyContainer}>
                <Typography
                  as="span"
                  variant="bodySmall"
                  className={styles.modalKeyLabel}
                >
                  API key
                </Typography>
                <pre className={styles.apiKeyPre}>
                  <Typography as="span" variant="bodySmall">
                    {forgotKeyDetails.key}
                  </Typography>
                </pre>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCopyNewApiKey}
                >
                  <Typography as="span" variant="bodySmall">
                    {forgotKeyCopyStatus === "copied"
                      ? "Copied!"
                      : forgotKeyCopyStatus === "error"
                      ? "Copy failed"
                      : "Copy API key"}
                  </Typography>
                </Button>
              </div>
            )}
            <div className={styles.modalActions}>
              <Button onClick={handleCloseForgotKeyModal} variant="secondary">
                <Typography as="span" variant="bodySmall">
                  Close
                </Typography>
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.mainCard}>
        <Typography variant="headingMedium">Dashboard</Typography>

        <div className={styles.userInfo}>
          <Typography variant="bodyMedium">
            Welcome, {dashboardData.user.name || dashboardData.user.username}
          </Typography>
          <Typography variant="bodyMedium">
            Email: {dashboardData.user.email}
          </Typography>
          {!dashboardData.user.approved && (
            <Typography variant="bodySmall" className={styles.warningText}>
              <span>⚠️</span> Account pending approval
            </Typography>
          )}
          {!dashboardData.user.emailVerified && (
            <Typography variant="bodySmall" className={styles.warningText}>
              <span>⚠️</span> Email not verified
            </Typography>
          )}
        </div>

        {cancelError && (
          <Typography variant="bodySmall" className={styles.cancelError}>
            Error cancelling subscription: {cancelError}
          </Typography>
        )}
        {cancelMessage && (
          <Typography variant="bodySmall" className={styles.cancelError}>
            {cancelMessage}
          </Typography>
        )}

        {dashboardData?.apiKeys?.length > 0 ? (
          <div>
            <Typography variant="headingSmall">Your API Keys</Typography>
            {dashboardData.apiKeys.map((apiKey, _index) => {
              const hourlyUsage = formatUsagePercentage(
                apiKey.limits.requestsPerHour - apiKey.remaining.hour,
                apiKey.limits.requestsPerHour
              );
              const dailyUsage = formatUsagePercentage(
                apiKey.limits.requestsPerDay - apiKey.remaining.day,
                apiKey.limits.requestsPerDay
              );
              const monthlyUsage = formatUsagePercentage(
                apiKey.limits.requestsPerMonth - apiKey.remaining.month,
                apiKey.limits.requestsPerMonth
              );

              return (
                <div key={apiKey.keyPrefix} className={styles.apiKeyCard}>
                  <div className={styles.apiHeader}>
                    <div>
                      <Typography variant="headingSmall">
                        {apiKey.name}
                      </Typography>
                      <Typography variant="bodySmall">
                        Tier: {apiKey.tier} | Key: {apiKey.keyPrefix}*** | Total
                        Usage: {apiKey.usageCount.toLocaleString()}
                      </Typography>
                    </div>
                    {apiKey.tier &&
                      apiKey.tier !== "HOBBY" &&
                      apiKey.keyStatus === "ACTIVE" && (
                        <div>
                          <div className={styles.actionsContainer}>
                            <Button
                              variant="red"
                              onClick={handleCancelSubscription}
                              disabled={cancelling}
                            >
                              <Typography as="span" variant="bodySmall">
                                {cancelling
                                  ? "Cancelling…"
                                  : "Cancel subscription"}
                              </Typography>
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() =>
                                handleForgotApiKey(apiKey.keyPrefix)
                              }
                              disabled={
                                forgotKeyLoading &&
                                forgotKeyTarget === apiKey.keyPrefix
                              }
                            >
                              <Typography as="span" variant="bodySmall">
                                {forgotKeyLoading &&
                                forgotKeyTarget === apiKey.keyPrefix
                                  ? "Sending…"
                                  : "Forgot API key"}
                              </Typography>
                            </Button>
                          </div>
                          {forgotKeyTarget === apiKey.keyPrefix && (
                            <>
                              {forgotKeyError && (
                                <Typography
                                  variant="bodySmall"
                                  className={styles.inlineError}
                                >
                                  {forgotKeyError}
                                </Typography>
                              )}
                              {forgotKeyMessage && (
                                <Typography
                                  variant="bodySmall"
                                  className={styles.inlineSuccess}
                                >
                                  {forgotKeyMessage}
                                </Typography>
                              )}
                            </>
                          )}
                          <Typography
                            variant="bodySmall"
                            className={styles.helperText}
                          >
                            Cancelling will stop renewals — subscription remains
                            active until period end.
                          </Typography>
                        </div>
                      )}
                  </div>

                  <div className={styles.rateLimitsGrid}>
                    <div>
                      <Typography variant="bodySmall">Hourly</Typography>
                      <Typography variant="bodySmall">
                        {hourlyUsage.remaining.toLocaleString()} /{" "}
                        {apiKey.limits.requestsPerHour.toLocaleString()}{" "}
                        remaining
                      </Typography>
                      <progress
                        className={styles.progressBar}
                        value={parseFloat(hourlyUsage.percentage)}
                        max={100}
                        data-danger={parseFloat(hourlyUsage.percentage) > 80}
                      />
                      <Typography variant="bodySmall">
                        {hourlyUsage.percentage}% used
                      </Typography>
                    </div>

                    <div>
                      <Typography variant="bodySmall">Daily</Typography>
                      <Typography variant="bodySmall">
                        {dailyUsage.remaining.toLocaleString()} /{" "}
                        {apiKey.limits.requestsPerDay.toLocaleString()}{" "}
                        remaining
                      </Typography>
                      <progress
                        className={styles.progressBar}
                        value={parseFloat(dailyUsage.percentage)}
                        max={100}
                        data-danger={parseFloat(dailyUsage.percentage) > 80}
                      />
                      <Typography variant="bodySmall">
                        {dailyUsage.percentage}% used
                      </Typography>
                    </div>

                    <div>
                      <Typography variant="bodySmall">Monthly</Typography>
                      <Typography variant="bodySmall">
                        {monthlyUsage.remaining.toLocaleString()} /{" "}
                        {apiKey.limits.requestsPerMonth.toLocaleString()}{" "}
                        remaining
                      </Typography>
                      <progress
                        className={styles.progressBar}
                        value={parseFloat(monthlyUsage.percentage)}
                        max={100}
                        data-danger={parseFloat(monthlyUsage.percentage) > 80}
                      />
                      <Typography variant="bodySmall">
                        {monthlyUsage.percentage}% used
                      </Typography>
                    </div>
                  </div>

                  <Typography variant="bodySmall" className={styles.features}>
                    Features:
                    {apiKey.features.allowLocationSearch && " Location Search"}
                    {apiKey.features.allowLocationSearch &&
                      apiKey.features.allowStats &&
                      ","}
                    {apiKey.features.allowStats && " Statistics"}
                    {!apiKey.features.allowLocationSearch &&
                      !apiKey.features.allowStats &&
                      " Basic API access only"}
                  </Typography>

                  {apiKey.lastUsed && (
                    <Typography variant="bodySmall" className={styles.lastUsed}>
                      Last used: {new Date(apiKey.lastUsed).toLocaleString()}
                    </Typography>
                  )}
                </div>
              );
            })}

            <div className={styles.summaryCard}>
              <Typography variant="bodySmall">
                Summary: {dashboardData.summary.totalApiKeys} API key(s) with{" "}
                {dashboardData.summary.totalUsage.toLocaleString()} total
                requests
              </Typography>
            </div>
          </div>
        ) : (
          <div>
            <Typography variant="bodyMedium">
              No API keys found. You may need to create an API key to get
              started.
            </Typography>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
