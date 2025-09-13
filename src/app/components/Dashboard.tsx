"use client";

import React, { useEffect, useState } from "react";

type ApiKey = {
  name: string;
  tier: string;
  keyPrefix: string;
  isActive: boolean;
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

      {/* API Keys */}
      {dashboardData.apiKeys.length > 0 ? (
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
                      {apiKey.limits.requestsPerHour.toLocaleString()} remaining
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
                      {apiKey.limits.requestsPerDay.toLocaleString()} remaining
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
              <strong>Summary:</strong> {dashboardData.summary.totalApiKeys} API
              key(s) with {dashboardData.summary.totalUsage.toLocaleString()}{" "}
              total requests
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p>
            No API keys found. You may need to create an API key to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
