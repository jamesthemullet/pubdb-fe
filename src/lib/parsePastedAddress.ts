export type ParsedAddress = {
  address: string;
  city: string;
  postcode: string;
};

const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;
const TRAILING_UK_POSTCODE = /^(.*?)[\s,]+([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;

function formatPostcode(raw: string): string {
  const match = raw.trim().match(UK_POSTCODE);
  return match ? `${match[1]} ${match[2]}`.toUpperCase() : raw.trim();
}

/**
 * Splits a pasted one-line UK address such as
 * "123 High Street, London, NW1 1FR" or "123 High Street, London NW1 1FR"
 * into street address, city and postcode. Returns null when the text doesn't
 * look like a full address, so the caller can fall back to a normal paste.
 */
export function parsePastedAddress(text: string): ParsedAddress | null {
  const parts = text
    .replace(/\r?\n/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  let last = parts.pop() as string;
  if (/^(uk|united kingdom|england|scotland|wales|northern ireland)$/i.test(last)) {
    if (parts.length < 2) return null;
    last = parts.pop() as string;
  }

  let postcode: string;
  if (UK_POSTCODE.test(last)) {
    postcode = last;
  } else {
    const trailing = last.match(TRAILING_UK_POSTCODE);
    if (!trailing) return null;
    parts.push(trailing[1].trim());
    postcode = trailing[2];
  }

  if (parts.length < 2) return null;

  const city = parts.pop() as string;
  return {
    address: parts.join(", "),
    city,
    postcode: formatPostcode(postcode),
  };
}
