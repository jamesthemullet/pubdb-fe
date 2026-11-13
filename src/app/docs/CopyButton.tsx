"use client";

import { useState } from "react";
import styles from "./page.module.css";

export function CopyButton({ text }: { text: string }){
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button type="button" className={styles.copyBtn} onClick={handleCopy} aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}>
        {copied ? "Copied" : "Copy"}
      </button>
      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
