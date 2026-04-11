import { WEEKDAYS } from "../../constants/pub";
import type { OpeningHoursEntry, OpeningHoursMap } from "../../types/pub";
import Typography from "./typography/typography";

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
      const parsed = JSON.parse(value) as OpeningHoursMap;
      return parsed;
    } catch (_error) {
      return null;
    }
  }
  return value;
};

const buildCaseInsensitiveMap = (source: OpeningHoursMap) => {
  return Object.entries(source).reduce<Record<string, OpeningHoursEntry>>(
    (acc, [key, entry]) => {
      acc[key.toLowerCase()] = entry;
      return acc;
    },
    {}
  );
};
