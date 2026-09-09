import { WEEKDAYS } from "../../../constants/pub";
import type { OpeningHoursEntry, OpeningHoursMap } from "../../../types/pub";
import Typography from "../../components/typography/typography";

type OpeningHoursDisplayProps = {
  value?: OpeningHoursMap | string | null;
};

export default function OpeningHoursDisplay({
  value,
}: OpeningHoursDisplayProps): React.JSX.Element {
  const normalized = normalizeOpeningHours(value);

  if (!normalized) {
    return (
      <dl>
        {WEEKDAYS.map((day) => (
          <div key={day} style={{ display: "flex", gap: "0.25em" }}>
            <dt>
              <Typography as="span" isBold>
                {day}:
              </Typography>
            </dt>
            {" "}
            <dd>-</dd>
          </div>
        ))}
      </dl>
    );
  }

  const lowerCaseMap = buildCaseInsensitiveMap(normalized);

  return (
    <dl>
      {WEEKDAYS.map((day) => {
        const entry = lowerCaseMap[day.toLowerCase()];
        let value: string;
        if (!entry) {
          value = "-";
        } else if (entry.closed) {
          value = "Closed";
        } else {
          value = `${entry.open || "-"} – ${entry.close || "-"}`;
        }
        return (
          <div key={day} style={{ display: "flex", gap: "0.25em" }}>
            <dt>
              <Typography as="span" isBold>
                {day}:
              </Typography>
            </dt>
            {" "}
            <dd>{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

const normalizeOpeningHours = (
  value?: OpeningHoursMap | string | null
): OpeningHoursMap | null => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as OpeningHoursMap)
        : null;
    } catch (_error) {
      return null;
    }
  }
  return value;
};

const buildCaseInsensitiveMap = (source: OpeningHoursMap): Record<string, OpeningHoursEntry> =>
  Object.fromEntries(
    Object.entries(source).map(([key, entry]) => [key.toLowerCase(), entry])
  );
