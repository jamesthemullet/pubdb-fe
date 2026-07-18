export type ChangelogEntryType = "added" | "changed" | "fixed";

export type ChangelogItem = {
  type: ChangelogEntryType;
  text: string;
};

export type ChangelogVersion = {
  version: string;
  date: string;
  items: ChangelogItem[];
};

const ENTRY_TYPES: ChangelogEntryType[] = ["added", "changed", "fixed"];

function isChangelogItem(item: unknown): item is ChangelogItem {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.type === "string" &&
    ENTRY_TYPES.includes(obj.type as ChangelogEntryType) &&
    typeof obj.text === "string"
  );
}

function isChangelogVersion(entry: unknown): entry is ChangelogVersion {
  if (typeof entry !== "object" || entry === null) return false;
  const obj = entry as Record<string, unknown>;
  return (
    typeof obj.version === "string" &&
    typeof obj.date === "string" &&
    Array.isArray(obj.items) &&
    obj.items.every(isChangelogItem)
  );
}

export function normalizeChangelog(payload: unknown): ChangelogVersion[] {
  if (typeof payload !== "object" || payload === null) return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (!Array.isArray(data)) return [];
  return data.filter(isChangelogVersion);
}
