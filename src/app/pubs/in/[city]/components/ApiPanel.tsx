import Link from "next/link";
import type { ReactElement } from "react";
import { CopyButton } from "@/app/docs/CopyButton";
import { buildPubsApiSample, buildPubsRequestLine } from "@/lib/pubsApiRequest";
import type { Pub } from "@/types/pub";
import styles from "./ApiPanel.module.css";

type Props = {
  city: string;
  pubs: Pub[];
  total: number;
  pageSize: number;
};

export default function ApiPanel({
  city,
  pubs,
  total,
  pageSize,
}: Props): ReactElement | null {
  if (pubs.length === 0) return null;

  const requestLine = buildPubsRequestLine({ city });
  const sampleJson = JSON.stringify(
    buildPubsApiSample(pubs, total, pageSize),
    null,
    2
  );

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Get this data via the API</h2>
      <p className={styles.intro}>
        Every pub on this page comes from the Pub DB API. Build your own map,
        list or app with it.
      </p>

      <div className={styles.codeBlock}>
        <span className={styles.codeLabel}>Request</span>
        <CopyButton text={requestLine} />
        <pre className={styles.codePre}>
          <code>{requestLine}</code>
        </pre>
      </div>

      <div className={styles.codeBlock}>
        <span className={styles.codeLabel}>Response</span>
        <CopyButton text={sampleJson} />
        <pre className={styles.codePre}>
          <code>{sampleJson}</code>
        </pre>
      </div>

      <div className={styles.links}>
        <Link href="/docs" className={styles.link}>
          Read the docs
        </Link>
        <Link href="/#pricing" className={styles.link}>
          See pricing
        </Link>
        <Link href="/register" className={styles.link}>
          Get an API key
        </Link>
      </div>
    </div>
  );
}
