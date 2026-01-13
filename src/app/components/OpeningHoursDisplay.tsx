import { WEEKDAYS } from "../../constants/pub";
import { OpeningHoursEntry, OpeningHoursMap } from "../../types/pub";

type OpeningHoursDisplayProps = {
  value?: OpeningHoursMap | string | null;
};

export default function OpeningHoursDisplay({
  value,
}: OpeningHoursDisplayProps) {
  const normalized = normalizeOpeningHours(value);

  if (!normalized) {
    return (
      <div>
        {WEEKDAYS.map((day) => (
          <div key={day}>
            <strong>{day}:</strong> -
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
              <strong>{day}:</strong> -
            </div>
          );
        }
        if (entry.closed) {
          return (
            <div key={day}>
              <strong>{day}:</strong> Closed
            </div>
          );
        }
        const open = entry.open || "-";
        const close = entry.close || "-";
        return (
          <div key={day}>
            <strong>{day}:</strong> {open} – {close}
          </div>
        );
      })}
    </div>
  );
}

function normalizeOpeningHours(
  value?: OpeningHoursMap | string | null
): OpeningHoursMap | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as OpeningHoursMap;
      return parsed;
    } catch (error) {
      console.warn("Invalid openingHours JSON:", error, value);
      return null;
    }
  }
  return value;
}

function buildCaseInsensitiveMap(source: OpeningHoursMap) {
  return Object.entries(source).reduce<Record<string, OpeningHoursEntry>>(
    (acc, [key, entry]) => {
      acc[key.toLowerCase()] = entry;
      return acc;
    },
    {}
  );
}
