import Button from "@/app/components/button/button";
import Dropdown from "@/app/components/dropdown/Dropdown";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import type { SunScheduleEntry } from "@/types/pub";
import styles from "./SunScheduleEditor.module.css";

export const MAX_SUN_SCHEDULE_ENTRIES = 288;

const HOURS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`
);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Props = {
  value?: SunScheduleEntry[];
  onChange: (entries: SunScheduleEntry[]) => void;
};

export default function SunScheduleEditor({ value, onChange }: Props) {
  const entries = value ?? [];

  const updateEntry = (index: number, patch: Partial<SunScheduleEntry>) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    if (entries.length >= MAX_SUN_SCHEDULE_ENTRIES) return;
    onChange([
      ...entries,
      {
        month: 1,
        time: "12:00",
      },
    ]);
  };

  return (
    <div className={styles.container}>
      {entries.length === 0 && (
        <Typography className={styles.emptyText}>
          No sun schedule entries yet.
        </Typography>
      )}

      {entries.map((entry, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: entries have no stable id and can repeat the same time/month
        <div key={index} className={styles.row}>
          <Dropdown
            aria-label={`Sun schedule entry ${index + 1} month`}
            value={entry.month ?? 1}
            onChange={(e) =>
              updateEntry(index, { month: Number.parseInt(e.target.value, 10) })
            }
          >
            {MONTHS.map((month, i) => (
              <option key={month} value={i + 1}>
                {month}
              </option>
            ))}
          </Dropdown>
          <Dropdown
            aria-label={`Sun schedule entry ${index + 1} hour`}
            value={entry.time}
            onChange={(e) => updateEntry(index, { time: e.target.value })}
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </Dropdown>
          <Input
            type="number"
            aria-label={`Sun schedule entry ${index + 1} seats`}
            placeholder="Seats"
            min={0}
            step={1}
            value={entry.seats ?? ""}
            onChange={(e) =>
              updateEntry(index, {
                seats:
                  e.target.value === ""
                    ? undefined
                    : Math.max(0, Math.round(Number(e.target.value))),
              })
            }
          />
          <Input
            type="number"
            aria-label={`Sun schedule entry ${index + 1} percent in sun`}
            placeholder="% sun"
            min={0}
            max={100}
            step={1}
            value={entry.percentInSun ?? ""}
            onChange={(e) =>
              updateEntry(index, {
                percentInSun:
                  e.target.value === ""
                    ? undefined
                    : Math.min(100, Math.max(0, Math.round(Number(e.target.value)))),
              })
            }
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => removeEntry(index)}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addEntry}
        disabled={entries.length >= MAX_SUN_SCHEDULE_ENTRIES}
      >
        Add hour
      </Button>
      {entries.length >= MAX_SUN_SCHEDULE_ENTRIES && (
        <Typography className={styles.limitText}>
          Maximum of {MAX_SUN_SCHEDULE_ENTRIES} entries reached.
        </Typography>
      )}
    </div>
  );
}
