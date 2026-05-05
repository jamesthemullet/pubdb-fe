"use client";

import { useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import styles from "./ApiPreview.module.css";

type CopyStatus = "idle" | "copied" | "error";

export default function ApiPreview() {
  const [json, setJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

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

  async function handleCopy() {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    } finally {
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="api-preview-heading">
      <Typography variant="headingSmall" id="api-preview-heading" as="h2">
        See the data
      </Typography>
      <Typography className={styles.subtitle}>
        A live pub object from the API — exactly what you get in your response.
      </Typography>

      <div className={styles.previewWrapper}>
        <div className={styles.toolbar}>
          <span className={styles.label}>GET /api/v1/pubs?limit=1</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={!json || copyStatus !== "idle"}
          >
            {copyStatus === "copied"
              ? "Copied!"
              : copyStatus === "error"
              ? "Copy failed"
              : "Copy"}
          </Button>
        </div>

        {loading ? (
          <div
            className={styles.skeleton}
            aria-busy="true"
            role="status"
            aria-label="Loading API response"
          />
        ) : json ? (
          <pre className={styles.pre}>{json}</pre>
        ) : (
          <p className={styles.fallback}>
            Could not load a sample response right now.
          </p>
        )}
      </div>
    </section>
  );
}
