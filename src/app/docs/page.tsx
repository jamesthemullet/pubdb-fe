"use client";

import type { Metadata } from "next";
import { useState } from "react";
import styles from "./page.module.css";

const CURL_QUICK_START = `curl https://api.pubdb.io/v1/pubs \\
  -H "Authorization: Bearer $PUBDB_KEY"`;

const JSON_QUICK_START = `{
  "data": [
    {
      "id": "pub_0f1a3b",
      "name": "The Crown & Anchor",
      "city": "London",
      "area": "Soho",
      "postcode": "W1D 3HB",
      "country": "GB",
      "hasRoastie": true,
      "rating": 4.4
    }
  ],
  "meta": {
    "total": 12418,
    "page": 1,
    "per_page": 50,
    "took_ms": 22
  }
}`;

const CURL_AUTH = `Authorization: Bearer pdb_live_xxff····`;

const CURL_POST_PUB = `{
  "name": "The Fox & Hounds",
  "address": "18 Passmore Street",
  "city": "London",
  "postcode": "SW1W 8HR",
  "country": "GB",
  "isIndependent": true,
  "hasFood": true,
  "hasCaskAle": true
}`;

const CURL_FILTER = `curl "https://api.pubdb.io/v1/pubs?hasCaskAle=true" \\
  -H "Authorization: Bearer $PUBDB_KEY"`;

const NAV_ITEMS = [
  { id: "quick-start", label: "Quick start" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "filtering", label: "Filtering & search" },
  { id: "pagination", label: "Pagination" },
  { id: "rate-limits", label: "Rate limits" },
  { id: "errors", label: "Errors" },
  { id: "sdks", label: "SDKs & libraries" },
];

const ENDPOINTS = [
  { method: "GET", path: "/v1/pubs", description: "List all pubs (paginated)" },
  { method: "GET", path: "/v1/pubs/:id", description: "Get a single pub by ID" },
  { method: "GET", path: "/v1/pubs/search", description: "Full-text + geo search" },
  { method: "GET", path: "/v1/beers", description: "List tracked beer types" },
  { method: "POST", path: "/v1/pubs", description: "Submit a new pub (auth required)" },
];

const RESPONSE_FIELDS = [
  { name: "id", type: "string", description: "Unique pub ID" },
  { name: "name", type: "string", description: "Pub name" },
  { name: "city", type: "string", description: "City or town" },
  { name: "area", type: "string | null", description: "Neighbourhood or borough" },
  { name: "address", type: "string", description: "Street address" },
  { name: "postcode", type: "string", description: "UK postcode" },
  { name: "country", type: "string", description: "ISO 3166-1 alpha-2 code" },
  { name: "lat / lng", type: "number", description: "WGS 84 coordinates" },
  { name: "isIndependent", type: "boolean", description: "True if not part of a chain" },
  { name: "chainId", type: "string | null", description: "Parent chain name, if applicable" },
];

const AMENITY_TAGS = [
  "isIndependent", "hasFood", "hasCaskAle", "hasBeerGarden",
  "hasDog", "isFamilyFocused", "isDogFriendly",
  "isLateNight", "hasLiveMusic", "hasPoolTable",
  "hasLeaderboard", "hasPremierLeague", "isLgbtFriendly",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className={styles.copyBtn} onClick={handleCopy}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className={styles.codeBlock}>
      {label && <span className={styles.codeLabel}>{label}</span>}
      <CopyButton text={code} />
      <pre className={styles.codePre}><code>{code}</code></pre>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`${styles.methodBadge} ${styles[`method${method}`]}`}>
      {method}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return <span className={styles.typeBadge}>{type}</span>;
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quick-start");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <nav className={styles.docsNav} aria-label="Documentation navigation">
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                className={`${styles.navItem} ${activeSection === id ? styles.navItemActive : ""}`}
                onClick={() => scrollTo(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.needHelp}>
          <p className={styles.needHelpTitle}>Need help?</p>
          <p className={styles.needHelpText}>
            Check the <a href="/changelog" className={styles.needHelpLink}>changelog</a> for
            recent updates or reach us at{" "}
            <a href="mailto:support@pubdb.io" className={styles.needHelpLink}>
              support@pubdb.io
            </a>
          </p>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>Documentation</h1>
              <code className={styles.apiVersion}>api.pubdb.io/v1</code>
            </div>
            <p className={styles.pageSubtitle}>
              Everything you need to integrate with the Pub DB API — authentication, endpoints,
              filtering, error handling, and SDKs.
            </p>
          </div>
          <div className={styles.headerActions}>
            <a href="/api/openapi.json" className={styles.headerBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              OpenAPI spec
            </a>
            <a href="/playground" className={styles.headerBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <polygon points="3,2 11,7 3,12" fill="currentColor" />
              </svg>
              Playground
            </a>
          </div>
        </div>

        <section id="quick-start" className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick start</h2>
          <p className={styles.sectionText}>
            Get your first response in under a minute. Grab an API key from the{" "}
            <a href="/profile" className={styles.inlineLink}>dashboard</a>, then make a request:
          </p>
          <CodeBlock code={CURL_QUICK_START} />
          <p className={styles.sectionText}>
            The API returns JSON by default. Every response wraps results in a{" "}
            <code className={styles.inlineCode}>data</code> array with a{" "}
            <code className={styles.inlineCode}>meta</code> object for pagination and timing.
          </p>
          <CodeBlock code={JSON_QUICK_START} />
          <div className={styles.baseUrlBar}>
            <span className={styles.baseUrlIcon} aria-hidden="true">◎</span>
            <span>
              <strong>Base URL</strong> — all endpoints are relative to{" "}
              <code className={styles.inlineCode}>https://api.pubdb.io/v1</code>. Include the version prefix on every request.
            </span>
          </div>
        </section>

        <section id="authentication" className={styles.section}>
          <h2 className={styles.sectionTitle}>Authentication</h2>
          <p className={styles.sectionText}>
            Authenticate via a Bearer token in the{" "}
            <code className={styles.inlineCode}>Authorization</code> header. Every request must
            include a valid API key.
          </p>
          <CodeBlock code={CURL_AUTH} />

          <h3 className={styles.subTitle}>Key types</h3>
          <div className={styles.keyTypesGrid}>
            <div className={styles.keyTypeCard}>
              <div className={styles.keyTypeHeader}>
                <span className={styles.keyTypeLive}>LIVE</span>
                <code className={styles.keyTypeCode}>pdb_live_*</code>
              </div>
              <p>Production keys. Counts against your monthly quota. Use for deployed apps.</p>
            </div>
            <div className={styles.keyTypeCard}>
              <div className={styles.keyTypeHeader}>
                <span className={styles.keyTypeTest}>TEST</span>
                <code className={styles.keyTypeCode}>pdb_test_*</code>
              </div>
              <p>Sandbox keys. No usage charge, returns fixture data. Use for development and CI.</p>
            </div>
          </div>

          <div className={styles.warningBar}>
            <span className={styles.warningIcon} aria-hidden="true">⚠</span>
            <span>
              <strong>Keep keys secret.</strong> Never expose API keys in client-side code or public
              repositories. Use environment variables or a server-side proxy.
            </span>
          </div>
        </section>

        <section id="endpoints" className={styles.section}>
          <h2 className={styles.sectionTitle}>Endpoints</h2>
          <p className={styles.sectionText}>
            The API exposes five core endpoints. All return JSON and accept query parameters
            for filtering and pagination.
          </p>
          <h3 className={styles.subTitle}>Endpoint reference</h3>
          <div className={styles.endpointList}>
            {ENDPOINTS.map(({ method, path, description }) => (
              <div key={path} className={styles.endpointRow}>
                <MethodBadge method={method} />
                <code className={styles.endpointPath}>{path}</code>
                <span className={styles.endpointDesc}>{description}</span>
              </div>
            ))}
          </div>

          <h3 className={styles.subTitle} id="get-pub-by-id" style={{ marginTop: "2rem" }}>
            GET /v1/pubs/:id
          </h3>
          <p className={styles.sectionText}>
            Returns the full pub object including amenities, opening hours, beer list, and beer
            garden details if available.
          </p>

          <h4 className={styles.fieldGroupTitle}>PATH PARAMETERS</h4>
          <div className={styles.fieldList}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLeft}>
                <code className={styles.fieldName}>id</code>
                <TypeBadge type="string" />
                <span className={styles.requiredBadge}>required</span>
              </div>
              <div className={styles.fieldDesc}>
                The pub&apos;s unique identifier, e.g.{" "}
                <code className={styles.inlineCode}>pub_f1a9b</code>
              </div>
            </div>
          </div>

          <h4 className={styles.fieldGroupTitle}>RESPONSE FIELDS</h4>
          <div className={styles.fieldList}>
            {RESPONSE_FIELDS.map(({ name, type, description }) => (
              <div key={name} className={styles.fieldRow}>
                <div className={styles.fieldLeft}>
                  <code className={styles.fieldName}>{name}</code>
                  <TypeBadge type={type} />
                </div>
                <div className={styles.fieldDesc}>{description}</div>
              </div>
            ))}
          </div>

          <h3 className={styles.subTitle} style={{ marginTop: "2rem" }}>POST /v1/pubs</h3>
          <p className={styles.sectionText}>
            Submit a new pub to the database. Requires a live API key on the Developer tier or
            above. The pub enters a moderation queue before going live.
          </p>
          <h4 className={styles.fieldGroupTitle}>REQUEST BODY</h4>
          <CodeBlock code={CURL_POST_PUB} />
        </section>

        <section id="filtering" className={styles.section}>
          <h2 className={styles.sectionTitle}>Filtering &amp; search</h2>
          <p className={styles.sectionText}>
            Filter pubs by amenities, location, or free-text search. All filters are query
            parameters on <code className={styles.inlineCode}>GET /v1/pubs</code> and{" "}
            <code className={styles.inlineCode}>GET /v1/pubs/search</code>.
          </p>

          <h3 className={styles.subTitle}>Amenity filters</h3>
          <p className={styles.sectionText}>
            Pass any amenity as a boolean query parameter to include only matching pubs.
            Multiple filters are AND-ed together.
          </p>
          <CodeBlock code={CURL_FILTER} />
          <div className={styles.amenityTags}>
            {AMENITY_TAGS.map((tag) => (
              <code key={tag} className={styles.amenityTag}>{tag}</code>
            ))}
          </div>
        </section>

        <section id="pagination" className={styles.section}>
          <h2 className={styles.sectionTitle}>Pagination</h2>
          <p className={styles.sectionText}>
            All list endpoints are paginated. Use <code className={styles.inlineCode}>page</code>{" "}
            and <code className={styles.inlineCode}>per_page</code> query parameters. The{" "}
            <code className={styles.inlineCode}>meta</code> object in every response includes{" "}
            <code className={styles.inlineCode}>total</code>, <code className={styles.inlineCode}>page</code>,{" "}
            and <code className={styles.inlineCode}>per_page</code>.
          </p>
          <CodeBlock code={`GET /v1/pubs?page=2&per_page=25`} />
          <p className={styles.sectionText}>
            Default page size is 50. Maximum is 100. Pages are 1-indexed.
          </p>
        </section>

        <section id="rate-limits" className={styles.section}>
          <h2 className={styles.sectionTitle}>Rate limits</h2>
          <p className={styles.sectionText}>
            Rate limits are applied per API key, per calendar month. Limits vary by plan.
          </p>
          <div className={styles.fieldList}>
            {[
              { plan: "Free", limit: "1,000 requests / month" },
              { plan: "Developer", limit: "100,000 requests / month" },
              { plan: "Pro", limit: "Unlimited" },
            ].map(({ plan, limit }) => (
              <div key={plan} className={styles.fieldRow}>
                <div className={styles.fieldLeft}>
                  <code className={styles.fieldName}>{plan}</code>
                </div>
                <div className={styles.fieldDesc}>{limit}</div>
              </div>
            ))}
          </div>
          <p className={styles.sectionText}>
            Exceeded limits return a{" "}
            <code className={styles.inlineCode}>429 Too Many Requests</code> response.
            Check the <code className={styles.inlineCode}>X-RateLimit-Remaining</code> header
            on any response to see your remaining quota.
          </p>
        </section>

        <section id="errors" className={styles.section}>
          <h2 className={styles.sectionTitle}>Errors</h2>
          <p className={styles.sectionText}>
            All errors return a JSON body with a <code className={styles.inlineCode}>code</code>{" "}
            and <code className={styles.inlineCode}>message</code> field.
          </p>
          <div className={styles.fieldList}>
            {[
              { code: "400", name: "bad_request", desc: "Malformed request or invalid parameter" },
              { code: "401", name: "unauthorized", desc: "Missing or invalid API key" },
              { code: "403", name: "forbidden", desc: "Key lacks permission for this action" },
              { code: "404", name: "not_found", desc: "Resource does not exist" },
              { code: "429", name: "rate_limited", desc: "Monthly quota exceeded" },
              { code: "500", name: "server_error", desc: "Something went wrong on our end" },
            ].map(({ code, name, desc }) => (
              <div key={code} className={styles.fieldRow}>
                <div className={styles.fieldLeft}>
                  <code className={styles.fieldName}>{code}</code>
                  <TypeBadge type={name} />
                </div>
                <div className={styles.fieldDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="sdks" className={styles.section}>
          <h2 className={styles.sectionTitle}>SDKs &amp; libraries</h2>
          <p className={styles.sectionText}>
            Official SDKs are in progress. In the meantime, the REST API works with any HTTP
            client.
          </p>
          <div className={styles.sdkList}>
            {[
              { lang: "JavaScript / TypeScript", status: "Coming soon", note: "npm install pubdb" },
              { lang: "Python", status: "Coming soon", note: "pip install pubdb" },
              { lang: "Go", status: "Coming soon", note: "go get github.com/pubdb/pubdb-go" },
            ].map(({ lang, status, note }) => (
              <div key={lang} className={styles.sdkRow}>
                <div className={styles.sdkLang}>{lang}</div>
                <span className={styles.sdkStatus}>{status}</span>
                <code className={styles.sdkNote}>{note}</code>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
