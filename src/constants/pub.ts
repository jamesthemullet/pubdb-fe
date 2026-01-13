export const PUB_REQUIRED_FIELDS = [
  "name",
  "city",
  "address",
  "postcode",
  "country",
] as const;

export type PubRequiredField = (typeof PUB_REQUIRED_FIELDS)[number];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const PHONE_REGEX = /^\+?[0-9\-\s]*$/;
