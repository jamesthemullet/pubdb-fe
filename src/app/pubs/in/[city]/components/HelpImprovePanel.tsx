import Link from "next/link";
import type { ReactElement } from "react";
import { pubCompletenessScore } from "@/lib/pubCompletenessScore";
import type { Pub } from "@/types/pub";
import styles from "./HelpImprovePanel.module.css";

type Props = {
  city: string;
  pubs: Pub[];
};

const MAX_PUBS = 5;

export default function HelpImprovePanel({
  city,
  pubs,
}: Props): ReactElement | null {
  const leastComplete = pubs
    .map((pub) => ({ pub, ...pubCompletenessScore(pub) }))
    .filter(({ score }) => score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_PUBS);

  if (leastComplete.length === 0) return null;

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Help improve {city}</h2>
      <p className={styles.intro}>
        These listings are missing details. Know any of them well?
      </p>
      <ul className={styles.list}>
        {leastComplete.map(({ pub, missing }) => (
          <li key={pub.id} className={styles.item}>
            <Link href={`/pubs/${pub.id}`} className={styles.pubLink}>
              {pub.name}
            </Link>
            <span className={styles.missing}>
              Missing {missing.join(", ")}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/add-pub" className={styles.addLink}>
        Know a pub we&apos;re missing? <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
