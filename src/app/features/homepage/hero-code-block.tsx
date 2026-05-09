"use client";

import { useEffect, useState } from "react";
import styles from "./hero-code-block.module.css";

const CODE_EXAMPLES = {
  curl: `$ curl https://api.pubdb.io/v1/pubs/search \\
  -G --data-urlencode "near=SE1 3XB" \\
      --data-urlencode "hasSundayRoast=true" \\
      -H "Authorization: Bearer $PUBDB_KEY"`,
  node: `const res = await fetch(
  'https://api.pubdb.io/v1/pubs/search?' +
  new URLSearchParams({
    near: 'SE1 3XB',
    hasSundayRoast: 'true',
  }),
  {
    headers: {
      Authorization: \`Bearer \${process.env.PUBDB_KEY}\`,
    },
  }
);
const { data } = await res.json();`,
  python: `import requests

res = requests.get(
    'https://api.pubdb.io/v1/pubs/search',
    params={
        'near': 'SE1 3XB',
        'hasSundayRoast': True,
    },
    headers={
        'Authorization': f'Bearer {PUBDB_KEY}',
    },
)
pubs = res.json()['data']`,
  ruby: `require 'net/http'
require 'json'

uri = URI('https://api.pubdb.io/v1/pubs/search')
uri.query = URI.encode_www_form(
  near: 'SE1 3XB',
  hasSundayRoast: true
)
res = Net::HTTP.get_response(
  uri,
  'Authorization' => "Bearer #{ENV['PUBDB_KEY']}"
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
          const pubs = (data as { data?: unknown[] })?.data;
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
      <div className={styles.tabs}>
        {LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            className={`${styles.tab} ${
              activeTab === lang ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(lang)}
          >
            {lang}
          </button>
        ))}
      </div>

      <pre className={styles.requestCode}>
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
