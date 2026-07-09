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

type TryResult = {
  status: number;
  latencyMs: number;
  body: unknown;
};

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/pubs", description: "List all pubs (paginated)" },
  { method: "GET", path: "/api/v1/pubs/:id", description: "Get a single pub by ID" },
  { method: "GET", path: "/api/v1/pubs/near", description: "Geo search — Developer tier+" },
  { method: "GET", path: "/api/v1/beer-types", description: "List tracked beer types" },
  { method: "GET", path: "/api/v1/contributors/leaderboard", description: "Contributor leaderboard" },
  { method: "GET", path: "/api/v1/stats", description: "Database stats — Developer tier+" },
];

// Only endpoints with an entry here have a live proxy route wired up (Stage 3).
// The rest stay disabled until Stage 4.
const PROXY_ROUTES: Record<string, string> = {
  "/api/v1/pubs": "/api/playground/pubs",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`${styles.methodBadge} ${styles[`method${method}`]}`}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={styles.copyBtn} onClick={handleCopy}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [selectedKeyPrefix, setSelectedKeyPrefix] = useState<string>("");
  const [tryingPath, setTryingPath] = useState<string | null>(null);
  const [result, setResult] = useState<TryResult | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

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

  async function handleTryIt(path: string) {
    const proxyUrl = PROXY_ROUTES[path];
    if (!proxyUrl) return;

    setTryingPath(path);
    setResult(null);
    setResultError(null);

    const token = localStorage.getItem("token");
    const start = performance.now();
    try {
      const res = await fetch(proxyUrl, { headers: buildAuthHeaders(token) });
      const latencyMs = Math.round(performance.now() - start);
      const body = await res.json().catch(() => null);
      setResult({ status: res.status, latencyMs, body });
    } catch {
      setResultError("Network error — couldn't reach the API.");
    } finally {
      setTryingPath(null);
    }
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
            <>
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
              <p className={styles.keyPickerNote}>
                Requests run using your signed-in account, not the raw key secret — your key
                is never sent to or stored in the browser.
              </p>
            </>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Endpoints</h2>
          <p className={styles.sectionText}>
            Pick an endpoint below to build a request and see a live response. Manage your
            keys from the <a href="/profile" className={styles.inlineLink}>dashboard</a>.
          </p>

          <div className={styles.endpointList}>
            {ENDPOINTS.map(({ method, path, description }) => {
              const isLive = path in PROXY_ROUTES;
              return (
                <div key={path} className={styles.endpointRow}>
                  <MethodBadge method={method} />
                  <code className={styles.endpointPath}>{path}</code>
                  <span className={styles.endpointDesc}>{description}</span>
                  <button
                    type="button"
                    className={styles.tryBtn}
                    disabled={!isLive || tryingPath === path}
                    onClick={() => handleTryIt(path)}
                  >
                    {tryingPath === path ? "Running…" : "Try it →"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className={styles.comingSoon}>
            Only <code className={styles.inlineCode}>GET /api/v1/pubs</code> is wired up to
            live requests so far — the rest are coming in later PRs.
          </p>

          {resultError && (
            <div role="alert" className={styles.resultError}>
              {resultError}
            </div>
          )}

          {result && (
            <div className={styles.resultBlock}>
              <div className={styles.resultHeader}>
                <span
                  className={`${styles.resultStatus} ${
                    result.status < 400 ? styles.resultStatusOk : styles.resultStatusError
                  }`}
                >
                  {result.status}
                </span>
                <span className={styles.resultLatency}>{result.latencyMs}ms</span>
                <CopyButton text={JSON.stringify(result.body, null, 2)} />
              </div>
              <pre className={styles.resultPre}>
                <code>{JSON.stringify(result.body, null, 2)}</code>
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
