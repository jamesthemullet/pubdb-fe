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

type ParamSpec = {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

type EndpointDef = {
  method: string;
  path: string;
  description: string;
  proxyUrl: string;
  pathParams?: ParamSpec[];
  queryParams?: ParamSpec[];
};

type TryResult = {
  requestLabel: string;
  publicUrl: string;
  status: number;
  latencyMs: number;
  body: unknown;
};

const ENDPOINTS: EndpointDef[] = [
  {
    method: "GET",
    path: "/api/v1/pubs",
    description: "List all pubs (paginated)",
    proxyUrl: "/api/playground/pubs",
    queryParams: [
      { name: "page", label: "page", placeholder: "1" },
      { name: "limit", label: "limit", options: ["10", "25", "50"] },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/pubs/:id",
    description: "Get a single pub by ID",
    proxyUrl: "/api/playground/pubs",
    pathParams: [{ name: "id", label: "id", required: true, placeholder: "pub_0f1a3b" }],
  },
  {
    method: "GET",
    path: "/api/v1/pubs/near",
    description: "Geo search — Developer tier+",
    proxyUrl: "/api/playground/pubs/near",
    queryParams: [
      { name: "lat", label: "lat", required: true, placeholder: "51.5074" },
      { name: "lng", label: "lng", required: true, placeholder: "-0.1278" },
      { name: "radius", label: "radius (km)", placeholder: "5" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/beer-types",
    description: "List tracked beer types",
    proxyUrl: "/api/playground/beer-types",
  },
  {
    method: "GET",
    path: "/api/v1/contributors/leaderboard",
    description: "Contributor leaderboard",
    proxyUrl: "/api/playground/leaderboard",
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    description: "Database stats — Developer tier+",
    proxyUrl: "/api/playground/stats",
  },
];

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`${styles.methodBadge} ${styles[`method${method}`]}`}>
      {method}
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={styles.copyBtn} onClick={handleCopy}>
      {copied ? "Copied" : (label ?? "Copy")}
    </button>
  );
}

function buildProxyRequest(
  endpoint: EndpointDef,
  values: Record<string, string>,
  keyPrefix: string
): { proxyUrl: string; publicPath: string } {
  const pathSegment = (endpoint.pathParams ?? [])
    .map((p) => `/${encodeURIComponent(values[p.name] ?? "")}`)
    .join("");
  const basePath = endpoint.path.replace(/\/:\w+/g, "");

  const queryParams = new URLSearchParams();
  for (const q of endpoint.queryParams ?? []) {
    const value = values[q.name]?.trim();
    if (value) queryParams.set(q.name, value);
  }

  const publicQuery = queryParams.toString();
  const publicPath = `${basePath}${pathSegment}${publicQuery ? `?${publicQuery}` : ""}`;

  queryParams.set("keyPrefix", keyPrefix);
  const proxyUrl = `${endpoint.proxyUrl}${pathSegment}?${queryParams.toString()}`;

  return { proxyUrl, publicPath };
}

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [selectedKeyPrefix, setSelectedKeyPrefix] = useState<string>("");
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
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

  function toggleExpanded(endpoint: EndpointDef) {
    const hasParams = (endpoint.pathParams?.length ?? 0) > 0 || (endpoint.queryParams?.length ?? 0) > 0;
    if (!hasParams) {
      void handleSend(endpoint, {});
      return;
    }
    setExpandedPath((prev) => (prev === endpoint.path ? null : endpoint.path));
    const allParams = [...(endpoint.pathParams ?? []), ...(endpoint.queryParams ?? [])];
    const defaults: Record<string, string> = {};
    for (const p of allParams) {
      if (p.options?.length) defaults[p.name] = p.options[0];
    }
    setParamValues(defaults);
  }

  async function handleSend(endpoint: EndpointDef, values: Record<string, string>) {
    if (!selectedKeyPrefix) return;
    const missingRequired = [...(endpoint.pathParams ?? []), ...(endpoint.queryParams ?? [])].some(
      (p) => p.required && !values[p.name]?.trim()
    );
    if (missingRequired) return;

    setTryingPath(endpoint.path);
    setResult(null);
    setResultError(null);

    const { proxyUrl, publicPath } = buildProxyRequest(endpoint, values, selectedKeyPrefix);
    const token = localStorage.getItem("token");
    const start = performance.now();
    try {
      const res = await fetch(proxyUrl, { headers: buildAuthHeaders(token) });
      const latencyMs = Math.round(performance.now() - start);
      const body = await res.json().catch(() => null);
      setResult({
        requestLabel: `${endpoint.method} ${publicPath}`,
        publicUrl: `https://api.thepubdb.com${publicPath}`,
        status: res.status,
        latencyMs,
        body,
      });
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
                Requests use a short-lived (5 minute) token scoped to this key — your
                permanent key secret is never sent to or stored in the browser.
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
            {ENDPOINTS.map((endpoint) => {
              const allParams = [...(endpoint.pathParams ?? []), ...(endpoint.queryParams ?? [])];
              const hasParams = allParams.length > 0;
              const isExpanded = expandedPath === endpoint.path;
              const isRunning = tryingPath === endpoint.path;
              const missingRequired = allParams.some((p) => p.required && !paramValues[p.name]?.trim());

              return (
                <div key={endpoint.path} className={styles.endpointGroup}>
                  <div className={styles.endpointRow}>
                    <MethodBadge method={endpoint.method} />
                    <code className={styles.endpointPath}>{endpoint.path}</code>
                    <span className={styles.endpointDesc}>{endpoint.description}</span>
                    <button
                      type="button"
                      className={styles.tryBtn}
                      disabled={!selectedKeyPrefix || isRunning}
                      onClick={() => toggleExpanded(endpoint)}
                    >
                      {isRunning ? "Running…" : hasParams ? (isExpanded ? "Close" : "Configure →") : "Try it →"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className={styles.paramForm}>
                      {allParams.map((p) => (
                        <div key={p.name} className={styles.paramField}>
                          <label className={styles.paramLabel} htmlFor={`param-${endpoint.path}-${p.name}`}>
                            {p.label}
                            {p.required && <span className={styles.requiredMark}> *</span>}
                          </label>
                          {p.options ? (
                            <select
                              id={`param-${endpoint.path}-${p.name}`}
                              className={styles.paramInput}
                              value={paramValues[p.name] ?? p.options[0]}
                              onChange={(e) =>
                                setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                              }
                            >
                              {p.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`param-${endpoint.path}-${p.name}`}
                              className={styles.paramInput}
                              type="text"
                              placeholder={p.placeholder}
                              value={paramValues[p.name] ?? ""}
                              onChange={(e) =>
                                setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                              }
                            />
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className={styles.sendBtn}
                        disabled={isRunning || !selectedKeyPrefix || missingRequired}
                        onClick={() => handleSend(endpoint, paramValues)}
                      >
                        {isRunning ? "Sending…" : "Send request →"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {resultError && (
            <div role="alert" className={styles.resultError}>
              {resultError}
            </div>
          )}

          {result && (
            <div className={styles.resultBlock}>
              <div className={styles.resultHeader}>
                <span className={styles.resultRequestLine}>{result.requestLabel}</span>
                <span
                  className={`${styles.resultStatus} ${
                    result.status < 400 ? styles.resultStatusOk : styles.resultStatusError
                  }`}
                >
                  {result.status}
                </span>
                <span className={styles.resultLatency}>{result.latencyMs}ms</span>
                <CopyButton
                  text={`curl "${result.publicUrl}" \\\n  -H "X-API-Key: $PUBDB_KEY"`}
                  label="Copy as curl"
                />
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
