"use client";

import { useState } from "react";
import Button from "../button/button";
import Typography from "../typography/typography";
import styles from "./api-key-quickstart.module.css";

type Tab = "curl" | "js";

type CopyStatus = "idle" | "copied" | "error";

const buildCurlSnippet = (apiKey: string) =>
  `curl "https://api.pubdb.dev/api/v1/pubs?search=london&limit=5" \\
  -H "x-api-key: ${apiKey}"`;

const buildJsSnippet = (apiKey: string) =>
  `const response = await fetch(
  "https://api.pubdb.dev/api/v1/pubs?search=london&limit=5",
  { headers: { "x-api-key": "${apiKey}" } }
);
const data = await response.json();
console.log(data);`;

type Props = { apiKey: string };

const ApiKeyQuickStart: React.FC<Props> = ({ apiKey }) => {
  const [activeTab, setActiveTab] = useState<Tab>("curl");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const snippet = activeTab === "curl" ? buildCurlSnippet(apiKey) : buildJsSnippet(apiKey);

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className={styles.container}>
      <Typography variant="headingSmall" as="h4" className={styles.heading}>
        Make your first request
      </Typography>
      <div className={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "curl"}
          className={`${styles.tab} ${activeTab === "curl" ? styles.tabActive : ""}`}
          onClick={() => { setActiveTab("curl"); setCopyStatus("idle"); }}
        >
          cURL
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "js"}
          className={`${styles.tab} ${activeTab === "js" ? styles.tabActive : ""}`}
          onClick={() => { setActiveTab("js"); setCopyStatus("idle"); }}
        >
          JavaScript
        </button>
      </div>
      <pre className={styles.codeBlock}>
        <code>{snippet}</code>
      </pre>
      <Button type="button" variant="secondary" onClick={handleCopy}>
        <Typography as="span" variant="bodySmall">
          {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Copy snippet"}
        </Typography>
      </Button>
    </div>
  );
};

export default ApiKeyQuickStart;
