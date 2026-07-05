"use client";

import { useEffect, useState } from "react";
import styles from "./hero-code-block.module.css";

const CODE_EXAMPLES = {
  curl: `$ curl https://api.thepubdb.com/api/v1/pubs \\
  -G --data-urlencode "search=London" \\
      --data-urlencode "amenities[hasSundayRoast]=true" \\
      -H "X-API-Key: $PUBDB_KEY"`,
  node: `const res = await fetch(
  'https://api.thepubdb.com/api/v1/pubs?' +
  new URLSearchParams({
    search: 'London',
    'amenities[hasSundayRoast]': 'true',
  }),
  {
    headers: {
      'X-API-Key': process.env.PUBDB_KEY,
    },
  }
);
const { data } = await res.json();`,
  python: `import requests

res = requests.get(
    'https://api.thepubdb.com/api/v1/pubs',
    params={
        'search': 'London',
        'amenities[hasSundayRoast]': 'true',
    },
    headers={
        'X-API-Key': PUBDB_KEY,
    },
)
pubs = res.json()['data']`,
  ruby: `require 'net/http'
require 'json'

uri = URI('https://api.thepubdb.com/api/v1/pubs')
uri.query = URI.encode_www_form(
  'search' => 'London',
  'amenities[hasSundayRoast]' => 'true'
)
res = Net::HTTP.get_response(
  uri,
  'X-API-Key' => ENV['PUBDB_KEY']
)
pubs = JSON.parse(res.body)['data']`,
} as const;

type Lang = keyof typeof CODE_EXAMPLES;
const LANGS = Object.keys(CODE_EXAMPLES) as Lang[];

export default function HeroCodeBlock() {
  const [activeTab, setActiveTab] = useState<Lang>("curl");
  const [json, setJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    fetch("/api/pubs?limit=1", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: unknown) => {
        if (!ignore) {
          const pubs =
            typeof data === "object" && data !== null && "data" in data
              ? (data as Record<string, unknown>).data
              : undefined;
          const sample = Array.isArray(pubs) ? pubs[0] : data;
          setJson(JSON.stringify(sample, null, 2));
        }
      })
      .catch(() => {
        if (!ignore) setJson(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  return (
    <div className={styles.codeBlock}>
      <div className={styles.tabs} role="tablist" aria-label="Code language">
        {LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            role="tab"
            aria-selected={activeTab === lang}
            id={`hero-tab-${lang}`}
            aria-controls="hero-code-panel"
            className={`${styles.tab} ${
              activeTab === lang ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(lang)}
          >
            {lang}
          </button>
        ))}
      </div>

      <pre
        id="hero-code-panel"
        role="tabpanel"
        aria-labelledby={`hero-tab-${activeTab}`}
        className={styles.requestCode}
      >
        <code>{CODE_EXAMPLES[activeTab]}</code>
      </pre>

      <div className={styles.separator} />

      {loading ? (
        <div className={styles.skeleton} />
      ) : json ? (
        <pre className={styles.responseCode}>
          <code>{json}</code>
        </pre>
      ) : (
        <p className={styles.fallback}>{"// response will appear here"}</p>
      )}
    </div>
  );
}
