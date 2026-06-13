"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function DocsCopyButton({ text }: { text: string }) {
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
