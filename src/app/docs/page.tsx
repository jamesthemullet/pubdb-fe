"use client";

import { useState } from "react";
import styles from "./page.module.css";

const CURL_QUICK_START = `curl https://api.thepubdb.com/api/v1/pubs \\
  -H "X-API-Key: $PUBDB_KEY"`;

const JSON_QUICK_START = `{
  "success": true,
  "data": [
    {
      "id": "pub_0f1a3b",
      "name": "The Crown & Anchor",
      "city": "London",
      "area": "Soho",
      "postcode": "W1D 3HB",
      "country": "GB",
      "hasCaskAle": true,
      "hasSundayRoast": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12418,
    "pages": 249,
    "hasNext": true,
    "hasPrev": false
  }
}`;

const CURL_AUTH = `X-API-Key: pk_developer_xxxx····`;


const CURL_FILTER = `curl "https://api.thepubdb.com/api/v1/pubs?hasCaskAle=true" \\
  -H "X-API-Key: $PUBDB_KEY"`;

const NAV_ITEMS = [
  { id: "quick-start", label: "Quick start" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "filtering", label: "Filtering & search" },
  { id: "pagination", label: "Pagination" },
  { id: "rate-limits", label: "Rate limits" },
  { id: "errors", label: "Errors" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/pubs", description: "List all pubs (paginated)" },
  { method: "GET", path: "/api/v1/pubs/:id", description: "Get a single pub by ID" },
  { method: "GET", path: "/api/v1/pubs/near", description: "Geo search — Developer tier+" },
  { method: "GET", path: "/api/v1/beer-types", description: "List tracked beer types" },
  { method: "GET", path: "/api/v1/contributors/leaderboard", description: "Contributor leaderboard" },
  { method: "GET", path: "/api/v1/stats", description: "Database stats — Developer tier+" },
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

  const scrollTo = (id: string): void => {
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
            {/* TODO: add /changelog page */}
            {/* Check the <a href="/changelog" className={styles.needHelpLink}>changelog</a> for
            recent updates or reach us at{" "} */}
            Reach us at{" "}
            <a href="mailto:hello@thepubdb.com" className={styles.needHelpLink}>
              hello@thepubdb.com
            </a>
          </p>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>Documentation</h1>
              <code className={styles.apiVersion}>api.thepubdb.com</code>
            </div>
            <p className={styles.pageSubtitle}>
              Everything you need to integrate with the Pub DB API — authentication, endpoints,
              filtering, error handling, and SDKs.
            </p>
          </div>
          <div className={styles.headerActions}>
            {/* TODO: add /playground page
            <a href="/playground" className={styles.headerBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <polygon points="3,2 11,7 3,12" fill="currentColor" />
              </svg>
              Playground
            </a>
            */}
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
            <code className={styles.inlineCode}>pagination</code> object for page metadata.
          </p>
          <CodeBlock code={JSON_QUICK_START} />
          <div className={styles.baseUrlBar}>
            <span className={styles.baseUrlIcon} aria-hidden="true">◎</span>
            <span>
              <strong>Base URL</strong> — all API key endpoints are relative to{" "}
              <code className={styles.inlineCode}>https://api.thepubdb.com/api/v1</code>.
            </span>
          </div>
        </section>

        <section id="authentication" className={styles.section}>
          <h2 className={styles.sectionTitle}>Authentication</h2>
          <p className={styles.sectionText}>
            Pass your API key in the{" "}
            <code className={styles.inlineCode}>X-API-Key</code> header on every request to an
            authenticated endpoint.
          </p>
          <CodeBlock code={CURL_AUTH} />

          <h3 className={styles.subTitle}>Tiers</h3>
          <div className={styles.keyTypesGrid}>
            <div className={styles.keyTypeCard}>
              <div className={styles.keyTypeHeader}>
                <span className={styles.keyTypeLive}>FREE</span>
                <code className={styles.keyTypeCode}>pk_free_*</code>
              </div>
              <p>Access to core list and detail endpoints. Limited monthly quota.</p>
            </div>
            <div className={styles.keyTypeCard}>
              <div className={styles.keyTypeHeader}>
                <span className={styles.keyTypeTest}>DEVELOPER</span>
                <code className={styles.keyTypeCode}>pk_developer_*</code>
              </div>
              <p>Unlocks geo search, stats, and a higher monthly quota.</p>
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

        </section>

        <section id="filtering" className={styles.section}>
          <h2 className={styles.sectionTitle}>Filtering &amp; search</h2>
          <p className={styles.sectionText}>
            Filter pubs by amenities, location, or free-text search. All filters are query
            parameters on <code className={styles.inlineCode}>GET /api/v1/pubs</code>.
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
            and <code className={styles.inlineCode}>limit</code> query parameters. The{" "}
            <code className={styles.inlineCode}>pagination</code> object in every response includes{" "}
            <code className={styles.inlineCode}>total</code>, <code className={styles.inlineCode}>page</code>,{" "}
            <code className={styles.inlineCode}>pages</code>, <code className={styles.inlineCode}>hasNext</code>,{" "}
            and <code className={styles.inlineCode}>hasPrev</code>.
          </p>
          <CodeBlock code={`GET /pubs?page=2&limit=25`} />
          <p className={styles.sectionText}>
            Default page size is 50. Pages are 1-indexed.
          </p>
        </section>

        <section id="rate-limits" className={styles.section}>
          <h2 className={styles.sectionTitle}>Rate limits</h2>
          <p className={styles.sectionText}>
            Rate limits are applied per API key across three windows: hourly, daily, and monthly.
          </p>
          <div className={styles.fieldList}>
            {[
              { plan: "Hobby", limit: "20 / hour · 200 / day · 1,000 / month" },
              { plan: "Developer", limit: "1,000 / hour · 10,000 / day · 100,000 / month" },
              { plan: "Business", limit: "5,000 / hour · 50,000 / day · 500,000 / month" },
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
              { code: "429", name: "rate_limited", desc: "Hourly, daily, or monthly quota exceeded" },
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

      </div>
    </div>
  );
}
