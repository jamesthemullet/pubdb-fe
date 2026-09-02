import type { OpeningHoursMap, Pub } from "@/types/pub";

export type PubForJsonLd = Pick<Pub, "name" | "address" | "city" | "postcode" | "country"> &
  Partial<Pick<Pub, "phone" | "website" | "imageUrl" | "lat" | "lng" | "openingHours">>;

const SCHEMA_DAY_OF_WEEK: Record<string, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};

type OpeningHoursSpec = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
};

function buildOpeningHoursSpecification(
  openingHours?: OpeningHoursMap
): OpeningHoursSpec[] | undefined {
  if (!openingHours) return undefined;
  const specs = Object.entries(openingHours)
    .map(([day, entry]): OpeningHoursSpec | undefined => {
      const dayOfWeek = SCHEMA_DAY_OF_WEEK[day.toLowerCase()];
      if (!dayOfWeek || !entry || entry.closed || !entry.open || !entry.close) return undefined;
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek,
        opens: entry.open,
        closes: entry.close,
      };
    })
    .filter((spec): spec is OpeningHoursSpec => Boolean(spec));
  return specs.length > 0 ? specs : undefined;
}

export function buildPubJsonLd(pub: PubForJsonLd, pageUrl: string): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: pub.name,
    url: pageUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: pub.address,
      addressLocality: pub.city,
      postalCode: pub.postcode,
      addressCountry: pub.country,
    },
  };

  if (pub.phone) jsonLd.telephone = pub.phone;
  if (pub.website) jsonLd.sameAs = pub.website;
  if (pub.imageUrl) jsonLd.image = pub.imageUrl;

  if (pub.lat != null && pub.lng != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: pub.lat,
      longitude: pub.lng,
    };
  }

  const openingHoursSpecification = buildOpeningHoursSpecification(pub.openingHours);
  if (openingHoursSpecification) jsonLd.openingHoursSpecification = openingHoursSpecification;

  return jsonLd;
}
