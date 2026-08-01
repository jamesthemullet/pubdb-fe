import { pubCompletenessScore } from "@/lib/pubCompletenessScore";
import type { Pub } from "@/types/pub";
import styles from "./CompletenessCard.module.css";

type Props = {
  pub: Pub;
  onEdit?: () => void;
};

export default function CompletenessCard({ pub, onEdit }: Props): React.JSX.Element {
  const { score, missing } = pubCompletenessScore(pub);

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.header}>
          <span className={styles.label}>Listing completeness</span>
          <span className={styles.score}>{score}%</span>
        </div>
        <div className={styles.barTrack} role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Listing completeness: ${score}%`}>
          <div className={styles.barFill} style={{ width: `${score}%` }} />
        </div>
        {missing.length > 0 && (
          <div className={styles.missingRow}>
            <span className={styles.missingLabel}>Missing:</span>
            {missing.map((field) => (
              <span key={field} className={styles.missingChip}>{field}</span>
            ))}
          </div>
        )}
      </div>
      {onEdit && (
        <button type="button" className={styles.improveBtn} onClick={onEdit}>
          Improve this listing →
        </button>
      )}
    </div>
  );
}
