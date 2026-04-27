import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import type { BeerType } from "@/types/pub";
import styles from "../page.module.css";

type Props = {
  selectedIds: string[];
  options: BeerType[];
  loading: boolean;
  error: string | null;
  onToggle: (id: string) => void;
};

export default function BeerTypeSelector({
  selectedIds,
  options,
  loading,
  error,
  onToggle,
}: Props) {
  return (
    <div>
      <span>Beer Types: </span>
      <div className={styles.beerTypesOuter}>
        {loading ? (
          <Typography as="span">Loading beer types…</Typography>
        ) : options.length > 0 ? (
          <div className={styles.beerTypeOptions}>
            {options.map((type) => (
              <label
                htmlFor={`beer-type-${type.id}`}
                key={type.id}
                className={styles.beerTypeLabel}
              >
                <Input
                  id={`beer-type-${type.id}`}
                  type="checkbox"
                  checked={selectedIds.includes(type.id)}
                  onChange={() => onToggle(type.id)}
                />
                <Typography as="span" className={styles.beerTypeName}>
                  {type.name}
                  {type.colour ? ` (${type.colour})` : ""}
                </Typography>
              </label>
            ))}
          </div>
        ) : (
          <Typography className={styles.emptyMessage}>
            {error || "No beer types available."}
          </Typography>
        )}
      </div>
    </div>
  );
}
