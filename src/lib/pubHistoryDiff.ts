import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import type { PubHistoryChange, PubHistoryEntry } from "@/types/pub";

// Fields that are either internal bookkeeping or too noisy/verbose to show as a
// raw from → to diff (PATCH sends the whole pub, so these "change" on every save).
const HIDDEN_HISTORY_FIELDS = new Set(["id", "createdAt", "updatedAt", "beerTypeIds"]);
const SUMMARY_ONLY_FIELDS = new Set(["openingHours", "beerTypes", "beerGardens"]);

const HISTORY_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  PUB_AMENITY_FIELDS.map(({ key, label }) => [key, label])
);
Object.assign(HISTORY_FIELD_LABELS, {
  name: "Name",
  address: "Address",
  city: "City",
  postcode: "Postcode",
  country: "Country",
  phone: "Phone",
  website: "Website",
  description: "Description",
  operator: "Operator",
  type: "Type",
  area: "Area",
  borough: "Borough",
  chainName: "Chain",
  lat: "Latitude",
  lng: "Longitude",
  closedDown: "Closed down",
  openingHours: "Opening hours",
  beerTypes: "Beer types",
  beerGardens: "Beer gardens",
  imageUrl: "Image",
});

const BOOLEAN_HISTORY_FIELDS = new Set([...Object.keys(HISTORY_FIELD_LABELS)].filter((key) =>
  PUB_AMENITY_FIELDS.some((f) => f.key === key)
));
BOOLEAN_HISTORY_FIELDS.add("closedDown");

export function humanizeFieldName(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function historyFieldLabel(field: string): string {
  return HISTORY_FIELD_LABELS[field] ?? humanizeFieldName(field);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function formatBoolean(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function formatDateValue(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}

function looksLikeIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

export function formatScalarValue(value: unknown): string {
  if (isEmptyValue(value)) return "—";
  if (looksLikeIsoDate(value)) return formatDateValue(value);
  return String(value);
}

export function describeFieldChange(field: string, change: PubHistoryChange): string | null {
  if (deepEqual(change.from, change.to)) return null;

  const label = historyFieldLabel(field);

  if (BOOLEAN_HISTORY_FIELDS.has(field)) {
    return `${label} ${formatBoolean(change.from)} → ${formatBoolean(change.to)}`;
  }

  if (SUMMARY_ONLY_FIELDS.has(field) || Array.isArray(change.from) || Array.isArray(change.to)) {
    if (isEmptyValue(change.from) && !isEmptyValue(change.to)) return `${label} added`;
    if (!isEmptyValue(change.from) && isEmptyValue(change.to)) return `${label} removed`;
    return `${label} updated`;
  }

  if (typeof change.from === "object" || typeof change.to === "object") {
    return `${label} updated`;
  }

  return `${label} ${formatScalarValue(change.from)} → ${formatScalarValue(change.to)}`;
}

export function listChangedFields(changedFields: PubHistoryEntry["changedFields"]): string[] {
  if (!changedFields) return [];
  return Object.entries(changedFields)
    .filter(([field]) => !HIDDEN_HISTORY_FIELDS.has(field))
    .map(([field, change]) => describeFieldChange(field, change))
    .filter((part): part is string => Boolean(part));
}
