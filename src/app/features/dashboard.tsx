"use client";

import React, { useEffect, useState } from "react";

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
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const token = localStorage.getItem("token");

        const res = await fetch(`${apiUrl}/auth/dashboard`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw { response: res, data: errorData };
        }

        const data = await res.json();
        setDashboardData(data);
      } catch (error: any) {
        console.error("Error fetching dashboard:", error);

        if (error.response && error.data) {
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/payments/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      setCancelError(
        err?.message || err?.error || "Failed to cancel subscription"
      );
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/auth/forgot-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    } catch (err: any) {
      console.error("Forgot API key error:", err);
      setForgotKeyError(
        err?.message || err?.error || "Failed to request API key reminder"
      );
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
    } catch (err) {
      console.error("Copy API key error:", err);
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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <p>Error loading dashboard: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              width: "min(640px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>New API key generated</h3>
            <p style={{ marginBottom: "1.25rem", color: "#444" }}>
              This key is shown only once. Copy it now and store it securely.
            </p>
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Name:</strong> {forgotKeyDetails.name || "Untitled key"}
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Tier:</strong> {forgotKeyDetails.tier || "—"}
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Status:</strong> {forgotKeyDetails.keyStatus || "—"}
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Key prefix:</strong> {forgotKeyDetails.keyPrefix || "—"}
            </div>
            {forgotKeyDetails.permissions?.length ? (
              <div style={{ marginBottom: "0.75rem" }}>
                <strong>Permissions:</strong>{" "}
                {forgotKeyDetails.permissions.join(", ")}
              </div>
            ) : null}
            {forgotKeyDetails.key && (
              <div style={{ marginBottom: "1.5rem" }}>
                <strong style={{ display: "block", marginBottom: "0.4rem" }}>
                  API key
                </strong>
                <pre
                  style={{
                    background: "#f5f5f5",
                    borderRadius: "6px",
                    padding: "0.75rem",
                    fontFamily:
                      'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    margin: 0,
                  }}
                >
                  {forgotKeyDetails.key}
                </pre>
                <button
                  onClick={handleCopyNewApiKey}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {forgotKeyCopyStatus === "copied"
                    ? "Copied!"
                    : forgotKeyCopyStatus === "error"
                    ? "Copy failed"
                    : "Copy API key"}
                </button>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleCloseForgotKeyModal}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Dashboard</h2>

        {/* User Info */}
        <div style={{ marginBottom: "2rem" }}>
          <p>
            <strong>
              Welcome, {dashboardData.user.name || dashboardData.user.username}
            </strong>
          </p>
          <p>Email: {dashboardData.user.email}</p>
          {!dashboardData.user.approved && (
            <p style={{ color: "orange" }}>⚠️ Account pending approval</p>
          )}
          {!dashboardData.user.emailVerified && (
            <p style={{ color: "orange" }}>⚠️ Email not verified</p>
          )}
        </div>

        {/* Cancel messages */}
        {cancelError && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            Error cancelling subscription: {cancelError}
          </div>
        )}
        {cancelMessage && (
          <div style={{ color: "green", marginBottom: "1rem" }}>
            {cancelMessage}
          </div>
        )}

        {/* API Keys */}
        {dashboardData?.apiKeys?.length > 0 ? (
          <div>
            <h3>Your API Keys</h3>
            {dashboardData.apiKeys.map((apiKey, index) => {
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
                <div
                  key={index}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <div>
                      <h4>{apiKey.name}</h4>
                      <p style={{ margin: 0, color: "#666" }}>
                        <strong>Tier:</strong> {apiKey.tier} |
                        <strong> Key:</strong> {apiKey.keyPrefix}*** |
                        <strong> Total Usage:</strong>{" "}
                        {apiKey.usageCount.toLocaleString()}
                      </p>
                    </div>
                    {apiKey.tier &&
                      apiKey.tier !== "HOBBY" &&
                      apiKey.keyStatus === "ACTIVE" && (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <button
                              onClick={handleCancelSubscription}
                              disabled={cancelling}
                              style={{
                                backgroundColor: "#ff4444",
                                color: "#fff",
                                border: "none",
                                padding: "0.5rem 1rem",
                                borderRadius: "4px",
                                cursor: cancelling ? "not-allowed" : "pointer",
                              }}
                            >
                              {cancelling
                                ? "Cancelling…"
                                : "Cancel subscription"}
                            </button>
                            <button
                              onClick={() =>
                                handleForgotApiKey(apiKey.keyPrefix)
                              }
                              disabled={
                                forgotKeyLoading &&
                                forgotKeyTarget === apiKey.keyPrefix
                              }
                              style={{
                                backgroundColor: "#007bff",
                                color: "#fff",
                                border: "none",
                                padding: "0.5rem 1rem",
                                borderRadius: "4px",
                                cursor:
                                  forgotKeyLoading &&
                                  forgotKeyTarget === apiKey.keyPrefix
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              {forgotKeyLoading &&
                              forgotKeyTarget === apiKey.keyPrefix
                                ? "Sending…"
                                : "Forgot API key"}
                            </button>
                          </div>
                          {forgotKeyTarget === apiKey.keyPrefix && (
                            <>
                              {forgotKeyError && (
                                <div
                                  style={{
                                    color: "red",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  {forgotKeyError}
                                </div>
                              )}
                              {forgotKeyMessage && (
                                <div
                                  style={{
                                    color: "green",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  {forgotKeyMessage}
                                </div>
                              )}
                            </>
                          )}
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "#666",
                              marginTop: "0.5rem",
                            }}
                          >
                            Cancelling will stop renewals — subscription remains
                            active until period end.
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Rate Limits */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <p>
                        <strong>Hourly</strong>
                      </p>
                      <p>
                        {hourlyUsage.remaining.toLocaleString()} /{" "}
                        {apiKey.limits.requestsPerHour.toLocaleString()}{" "}
                        remaining
                      </p>
                      <div
                        style={{
                          backgroundColor: "#e0e0e0",
                          borderRadius: "4px",
                          height: "8px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor:
                              parseFloat(hourlyUsage.percentage) > 80
                                ? "#ff4444"
                                : "#4CAF50",
                            width: `${hourlyUsage.percentage}%`,
                            height: "100%",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                      <small>{hourlyUsage.percentage}% used</small>
                    </div>

                    <div>
                      <p>
                        <strong>Daily</strong>
                      </p>
                      <p>
                        {dailyUsage.remaining.toLocaleString()} /{" "}
                        {apiKey.limits.requestsPerDay.toLocaleString()}{" "}
                        remaining
                      </p>
                      <div
                        style={{
                          backgroundColor: "#e0e0e0",
                          borderRadius: "4px",
                          height: "8px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor:
                              parseFloat(dailyUsage.percentage) > 80
                                ? "#ff4444"
                                : "#4CAF50",
                            width: `${dailyUsage.percentage}%`,
                            height: "100%",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                      <small>{dailyUsage.percentage}% used</small>
                    </div>

                    <div>
                      <p>
                        <strong>Monthly</strong>
                      </p>
                      <p>
                        {monthlyUsage.remaining.toLocaleString()} /{" "}
                        {apiKey.limits.requestsPerMonth.toLocaleString()}{" "}
                        remaining
                      </p>
                      <div
                        style={{
                          backgroundColor: "#e0e0e0",
                          borderRadius: "4px",
                          height: "8px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor:
                              parseFloat(monthlyUsage.percentage) > 80
                                ? "#ff4444"
                                : "#4CAF50",
                            width: `${monthlyUsage.percentage}%`,
                            height: "100%",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                      <small>{monthlyUsage.percentage}% used</small>
                    </div>
                  </div>

                  {/* Features */}
                  <div
                    style={{
                      marginTop: "1rem",
                      fontSize: "0.9em",
                      color: "#666",
                    }}
                  >
                    <strong>Features:</strong>
                    {apiKey.features.allowLocationSearch && " Location Search"}
                    {apiKey.features.allowLocationSearch &&
                      apiKey.features.allowStats &&
                      ","}
                    {apiKey.features.allowStats && " Statistics"}
                    {!apiKey.features.allowLocationSearch &&
                      !apiKey.features.allowStats &&
                      " Basic API access only"}
                  </div>

                  {apiKey.lastUsed && (
                    <p
                      style={{
                        fontSize: "0.9em",
                        color: "#666",
                        margin: "0.5rem 0 0 0",
                      }}
                    >
                      Last used: {new Date(apiKey.lastUsed).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
              }}
            >
              <p>
                <strong>Summary:</strong> {dashboardData.summary.totalApiKeys}{" "}
                API key(s) with{" "}
                {dashboardData.summary.totalUsage.toLocaleString()} total
                requests
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p>
              No API keys found. You may need to create an API key to get
              started.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
