"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "./page.module.css";

type ApiKey = {
  name: string;
  tier: string;
  keyPrefix: string;
  isActive: boolean;
};

type DashboardData = {
  apiKeys: ApiKey[];
};

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/pubs", description: "List all pubs (paginated)" },
  { method: "GET", path: "/api/v1/pubs/:id", description: "Get a single pub by ID" },
  { method: "GET", path: "/api/v1/pubs/near", description: "Geo search — Developer tier+" },
  { method: "GET", path: "/api/v1/beer-types", description: "List tracked beer types" },
  { method: "GET", path: "/api/v1/contributors/leaderboard", description: "Contributor leaderboard" },
  { method: "GET", path: "/api/v1/stats", description: "Database stats — Developer tier+" },
];

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`${styles.methodBadge} ${styles[`method${method}`]}`}>
      {method}
    </span>
  );
}

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [selectedKeyPrefix, setSelectedKeyPrefix] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    fetch("/api/auth/dashboard", { headers: buildAuthHeaders(token) })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: DashboardData) => {
        setApiKeys(data.apiKeys);
        if (data.apiKeys.length > 0) {
          setSelectedKeyPrefix(data.apiKeys.find((k) => k.isActive)?.keyPrefix ?? data.apiKeys[0].keyPrefix);
        }
      })
      .catch(() => setKeysError("Couldn't load your API keys."));
  }, [user]);

  if (!user) {
    return <AuthGate context="Playground" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div>
            <h1 className={styles.pageTitle}>Playground</h1>
            <p className={styles.pageSubtitle}>
              Try live requests against the Pub DB API using one of your own API keys.
            </p>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>API key</h2>

          {keysError && <p className={styles.sectionText}>{keysError}</p>}

          {apiKeys === null && !keysError && (
            <p className={styles.sectionText}>Loading your API keys…</p>
          )}

          {apiKeys?.length === 0 && (
            <p className={styles.sectionText}>
              You don&apos;t have an API key yet. Create one from the{" "}
              <a href="/profile" className={styles.inlineLink}>dashboard</a> to use the
              playground.
            </p>
          )}

          {apiKeys && apiKeys.length > 0 && (
            <div className={styles.keyPickerRow}>
              <label className={styles.keyPickerLabel} htmlFor="playground-key">
                Using key
              </label>
              <select
                id="playground-key"
                className={styles.keyPicker}
                value={selectedKeyPrefix}
                onChange={(e) => setSelectedKeyPrefix(e.target.value)}
              >
                {apiKeys.map((key) => (
                  <option key={key.keyPrefix} value={key.keyPrefix}>
                    {key.name} ({key.keyPrefix}····) — {key.tier}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Endpoints</h2>
          <p className={styles.sectionText}>
            Pick an endpoint below to build a request and see a live response. Manage your
            keys from the <a href="/profile" className={styles.inlineLink}>dashboard</a>.
          </p>

          <div className={styles.endpointList}>
            {ENDPOINTS.map(({ method, path, description }) => (
              <div key={path} className={styles.endpointRow}>
                <MethodBadge method={method} />
                <code className={styles.endpointPath}>{path}</code>
                <span className={styles.endpointDesc}>{description}</span>
                <button type="button" className={styles.tryBtn} disabled>
                  Try it →
                </button>
              </div>
            ))}
          </div>

          <p className={styles.comingSoon}>
            Live requests are coming soon — this page is a work in progress.
          </p>
        </section>
      </div>
    </div>
  );
}
