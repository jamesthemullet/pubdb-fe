import type { PubAmenityKey } from "@/constants/pubFormFields";
import type { Pub } from "@/types/pub";

export type PubsApiRequestParams = {
  city: string;
  amenity?: PubAmenityKey;
};

/** `{ city: "Leeds" }` -> `"GET /pubs?city=Leeds"`. */
export function buildPubsRequestLine({ city, amenity }: PubsApiRequestParams): string {
  const params = new URLSearchParams({ city });
  if (amenity) params.set(`amenities[${amenity}]`, "true");
  return `GET /pubs?${params.toString()}`;
}

const SAMPLE_FIELDS = [
  "id",
  "name",
  "city",
  "area",
  "postcode",
  "country",
  "hasCaskAle",
  "hasSundayRoast",
] as const;

type SamplePub = Partial<Pick<Pub, (typeof SAMPLE_FIELDS)[number]>>;

function trimPubForSample(pub: Pub): SamplePub {
  const sample: SamplePub = {};
  for (const field of SAMPLE_FIELDS) {
    const value = pub[field];
    if (value !== undefined) sample[field] = value as never;
  }
  return sample;
}

export type PubsApiSample = {
  success: true;
  data: SamplePub[];
  pagination: {
    page: 1;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: false;
  };
};

/** Builds a trimmed `GET /pubs` sample response from pubs already fetched for a page. */
export function buildPubsApiSample(
  pubs: Pub[],
  total: number,
  pageSize: number,
  sampleSize = 1
): PubsApiSample {
  const data = pubs.slice(0, sampleSize).map(trimPubForSample);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return {
    success: true,
    data,
    pagination: {
      page: 1,
      limit: pageSize,
      total,
      pages,
      hasNext: pages > 1,
      hasPrev: false,
    },
  };
}
