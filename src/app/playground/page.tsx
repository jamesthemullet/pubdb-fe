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
  kind: "path" | "query";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

type EndpointDef = {
  method: string;
  path: string;
  description: string;
  proxyUrl: string;
  params: ParamSpec[];
};

type TryResult = {
  requestLabel: string;
  publicUrl: string;
  status: number;
  latencyMs: number;
  body: unknown;
  rateLimitRemaining: string | null;
  rateLimitLimit: string | null;
};

const ENDPOINTS: EndpointDef[] = [
  {
    method: "GET",
    path: "/api/v1/pubs",
    description: "List all pubs (paginated)",
    proxyUrl: "/api/playground/pubs",
    params: [
      { name: "page", label: "page", kind: "query", placeholder: "1" },
      { name: "limit", label: "limit", kind: "query", options: ["10", "25", "50"] },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/pubs/:id",
    description: "Get a single pub by ID",
    proxyUrl: "/api/playground/pubs",
    params: [{ name: "id", label: "id", kind: "path", required: true, placeholder: "pub_0f1a3b" }],
  },
  {
    method: "GET",
    path: "/api/v1/pubs/near",
    description: "Geo search — Developer tier+",
    proxyUrl: "/api/playground/pubs/near",
    params: [
      { name: "lat", label: "lat", kind: "query", required: true, placeholder: "51.5074" },
      { name: "lng", label: "lng", kind: "query", required: true, placeholder: "-0.1278" },
      { name: "radius", label: "radius (km)", kind: "query", placeholder: "5" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/beer-types",
    description: "List tracked beer types",
    proxyUrl: "/api/playground/beer-types",
    params: [],
  },
  {
    method: "GET",
    path: "/api/v1/contributors/leaderboard",
    description: "Contributor leaderboard",
    proxyUrl: "/api/playground/leaderboard",
    params: [],
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    description: "Database stats — Developer tier+",
    proxyUrl: "/api/playground/stats",
    params: [],
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

function defaultParamValues(endpoint: EndpointDef): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const p of endpoint.params) {
    if (p.options?.length) defaults[p.name] = p.options[0];
  }
  return defaults;
}

function buildPublicPath(endpoint: EndpointDef, values: Record<string, string>): string {
  const pathSegment = endpoint.params
    .filter((p) => p.kind === "path")
    .map((p) => `/${encodeURIComponent(values[p.name] ?? "")}`)
    .join("");
  const basePath = endpoint.path.replace(/\/:\w+/g, "");

  const queryParams = new URLSearchParams();
  for (const q of endpoint.params.filter((p) => p.kind === "query")) {
    const value = values[q.name]?.trim();
    if (value) queryParams.set(q.name, value);
  }
  const publicQuery = queryParams.toString();

  return `${basePath}${pathSegment}${publicQuery ? `?${publicQuery}` : ""}`;
}

function buildProxyRequest(
  endpoint: EndpointDef,
  values: Record<string, string>,
  keyPrefix: string
): { proxyUrl: string; publicPath: string } {
  const pathSegment = endpoint.params
    .filter((p) => p.kind === "path")
    .map((p) => `/${encodeURIComponent(values[p.name] ?? "")}`)
    .join("");

  const queryParams = new URLSearchParams();
  for (const q of endpoint.params.filter((p) => p.kind === "query")) {
    const value = values[q.name]?.trim();
    if (value) queryParams.set(q.name, value);
  }
  queryParams.set("keyPrefix", keyPrefix);

  return {
    proxyUrl: `${endpoint.proxyUrl}${pathSegment}?${queryParams.toString()}`,
    publicPath: buildPublicPath(endpoint, values),
  };
}

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [selectedKeyPrefix, setSelectedKeyPrefix] = useState<string>("");
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    defaultParamValues(ENDPOINTS[0])
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TryResult | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [history, setHistory] = useState<TryResult[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

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

  function selectEndpoint(endpoint: EndpointDef) {
    setActiveEndpoint(endpoint);
    setParamValues(defaultParamValues(endpoint));
    setResult(null);
    setResultError(null);
  }

  const missingRequired = activeEndpoint.params.some(
    (p) => p.required && !paramValues[p.name]?.trim()
  );
  const canSend = !!selectedKeyPrefix && !missingRequired && !sending;
  const curlText = `curl "https://api.thepubdb.com${buildPublicPath(activeEndpoint, paramValues)}" \\\n  -H "X-API-Key: $PUBDB_KEY"`;

  async function handleSend() {
    if (!canSend) return;

    setSending(true);
    setResult(null);
    setResultError(null);

    const { proxyUrl, publicPath } = buildProxyRequest(activeEndpoint, paramValues, selectedKeyPrefix);
    const token = localStorage.getItem("token");
    const start = performance.now();
    try {
      const res = await fetch(proxyUrl, { headers: buildAuthHeaders(token) });
      const latencyMs = Math.round(performance.now() - start);
      const body = await res.json().catch(() => null);
      const entry: TryResult = {
        requestLabel: `${activeEndpoint.method} ${publicPath}`,
        publicUrl: `https://api.thepubdb.com${publicPath}`,
        status: res.status,
        latencyMs,
        body,
        rateLimitRemaining: res.headers.get("x-ratelimit-remaining"),
        rateLimitLimit: res.headers.get("x-ratelimit-limit"),
      };
      setResult(entry);
      setHistory((prev) => [entry, ...prev].slice(0, 5));
    } catch {
      setResultError("Network error — couldn't reach the API.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.contentHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Playground</h1>
            <span className={styles.interactiveBadge}>interactive</span>
          </div>
          <p className={styles.pageSubtitle}>
            Build and test requests against the live Pub DB API using one of your own API
            keys.
          </p>
        </div>
        <div className={styles.headerActions}>
          <a href="/docs" className={styles.headerBtn}>
            View docs
          </a>
          <CopyButton text={curlText} label="Copy as cURL" />
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.leftCol}>
          <div className={styles.requestBar}>
            <div className={styles.requestBarMethod}>
              <MethodBadge method={activeEndpoint.method} />
              <code className={styles.requestBarPath}>{activeEndpoint.path}</code>
            </div>
            <code className={styles.requestBarUrl}>
              https://api.thepubdb.com{buildPublicPath(activeEndpoint, paramValues)}
            </code>
            <button type="button" className={styles.sendBtn} disabled={!canSend} onClick={handleSend}>
              {sending ? "Sending…" : "Send"}
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.cardHeaderLabel}>Authorization</span>
              <span className={styles.authBadge}>API Key</span>
            </div>

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
                <span className={styles.fieldLabel}>API KEY</span>
                <select
                  aria-label="Using key"
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
                <p className={styles.keyPickerNote}>
                  Requests use a short-lived (5 minute) token scoped to this key — your
                  permanent key secret is never sent to or stored in the browser.
                </p>
              </>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.cardHeaderLabel}>
                Parameters <span className={styles.cardHeaderCount}>{activeEndpoint.params.length} params</span>
              </span>
            </div>
            {activeEndpoint.params.length === 0 ? (
              <p className={styles.sectionText}>This endpoint takes no parameters.</p>
            ) : (
              <div className={styles.paramTable}>
                {activeEndpoint.params.map((p) => (
                  <div key={p.name} className={styles.paramTableRow}>
                    <span className={styles.paramName}>
                      {p.label}
                      {p.required && <span className={styles.requiredMark}> *</span>}
                    </span>
                    {p.options ? (
                      <select
                        aria-label={p.label}
                        className={styles.paramInput}
                        value={paramValues[p.name] ?? p.options[0]}
                        onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      >
                        {p.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={p.label}
                        className={styles.paramInput}
                        type="text"
                        placeholder={p.placeholder}
                        value={paramValues[p.name] ?? ""}
                        onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      />
                    )}
                    <span className={styles.paramKindBadge}>{p.kind.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.cardHeaderLabel}>Endpoints</span>
            </div>
            <div className={styles.endpointList}>
              {ENDPOINTS.map((endpoint) => (
                <button
                  key={endpoint.path}
                  type="button"
                  className={`${styles.endpointRow} ${
                    activeEndpoint.path === endpoint.path ? styles.endpointRowActive : ""
                  }`}
                  onClick={() => selectEndpoint(endpoint)}
                >
                  <MethodBadge method={endpoint.method} />
                  <code className={styles.endpointPath}>{endpoint.path}</code>
                  <span className={styles.endpointDesc}>{endpoint.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          {resultError && (
            <div role="alert" className={styles.resultError}>
              {resultError}
            </div>
          )}

          {!result && !resultError && (
            <div className={styles.emptyResponse}>
              <span className={styles.emptyResponseIcon} aria-hidden="true">⚡</span>
              <p className={styles.emptyResponseTitle}>No response yet</p>
              <p className={styles.emptyResponseText}>Select an endpoint and click Send to make a request.</p>
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
                {result.rateLimitRemaining && (
                  <span className={styles.resultQuota}>
                    {result.rateLimitRemaining}
                    {result.rateLimitLimit ? `/${result.rateLimitLimit}` : ""} left
                  </span>
                )}
                <CopyButton text={JSON.stringify(result.body, null, 2)} />
              </div>
              <pre className={styles.resultPre}>
                <code>{JSON.stringify(result.body, null, 2)}</code>
              </pre>
            </div>
          )}

          {history.length > 0 && (
            <div className={styles.historyBlock}>
              <button
                type="button"
                className={styles.historyToggle}
                onClick={() => setHistoryOpen((prev) => !prev)}
              >
                {historyOpen ? "Hide" : "Show"} history ({history.length})
              </button>
              {historyOpen && (
                <div className={styles.historyList}>
                  {history.map((entry, i) => (
                    <button
                      // biome-ignore lint/suspicious/noArrayIndexKey: entries can repeat the same request
                      key={i}
                      type="button"
                      className={styles.historyRow}
                      onClick={() => setResult(entry)}
                    >
                      <span
                        className={`${styles.resultStatus} ${
                          entry.status < 400 ? styles.resultStatusOk : styles.resultStatusError
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className={styles.historyRequestLine}>{entry.requestLabel}</span>
                      <span className={styles.resultLatency}>{entry.latencyMs}ms</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
