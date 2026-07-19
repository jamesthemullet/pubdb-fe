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
      <div>
        {WEEKDAYS.map((day) => (
          <div key={day}>
            <Typography as="span" isBold>
              {day}:
            </Typography>{" "}
            -
          </div>
        ))}
      </div>
    );
  }

  const lowerCaseMap = buildCaseInsensitiveMap(normalized);

  return (
    <div>
      {WEEKDAYS.map((day) => {
        const entry = lowerCaseMap[day.toLowerCase()];
        if (!entry) {
          return (
            <div key={day}>
              <Typography as="span" isBold>
                {day}:
              </Typography>{" "}
              -
            </div>
          );
        }
        if (entry.closed) {
          return (
            <div key={day}>
              <Typography as="span" isBold>
                {day}:
              </Typography>{" "}
              Closed
            </div>
          );
        }
        const open = entry.open || "-";
        const close = entry.close || "-";
        return (
          <div key={day}>
            <Typography as="span" isBold>
              {day}:
            </Typography>{" "}
            {open} – {close}
          </div>
        );
      })}
    </div>
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
