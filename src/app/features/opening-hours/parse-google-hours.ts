const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type ParsedOpeningHours = Record<string, DayHours>;

export function parseGoogleHours(text: string): ParsedOpeningHours | null {
  const result: ParsedOpeningHours = Object.fromEntries(
    DAYS.map((day) => [day, { open: "", close: "", closed: false }])
  );

  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let found = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const day = DAYS.find((d) => d.toLowerCase() === line.toLowerCase());

    if (day && i + 1 < lines.length) {
      const timeLine = lines[i + 1];
      if (timeLine.toLowerCase() === "closed") {
        result[day] = { open: "", close: "", closed: true };
        found = true;
        i += 2;
      } else {
        const parsed = parseTimeRange(timeLine);
        if (parsed) {
          result[day] = { ...parsed, closed: false };
          found = true;
          i += 2;
        } else {
          i++;
        }
      }
    } else {
      i++;
    }
  }

  return found ? result : null;
}

function parseTimeRange(
  timeStr: string
): { open: string; close: string } | null {
  // Google uses en-dash (–) between times
  const enDashIdx = timeStr.indexOf("\u2013");
  const splitIdx = enDashIdx !== -1 ? enDashIdx : timeStr.indexOf("-");

  if (splitIdx === -1) return null;

  const openPart = timeStr.substring(0, splitIdx).trim();
  const closePart = timeStr.substring(splitIdx + 1).trim();

  const closeAmPm =
    closePart.match(/\s*(am|pm)$/i)?.[1]?.toLowerCase() ?? null;

  const closeTime = parseTimePart(closePart, closeAmPm);
  const openTime = parseTimePart(openPart, closeAmPm);

  if (!closeTime || !openTime) return null;

  return { open: openTime, close: closeTime };
}

function parseTimePart(
  timeStr: string,
  inheritedAmPm: string | null
): string | null {
  const amPmMatch = timeStr.match(/\s*(am|pm)$/i);
  const ampm = amPmMatch ? amPmMatch[1].toLowerCase() : inheritedAmPm;
  const clean = timeStr.replace(/\s*(am|pm)$/i, "").trim();

  const parts = clean.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours) || isNaN(minutes)) return null;

  let h = hours;
  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;

  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
