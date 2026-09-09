import { describe, expect, it } from "vitest";
import { buildPubJsonLd, type PubForJsonLd } from "./pubJsonLd";

const basePub: PubForJsonLd = {
  name: "The Test Pub",
  address: "1 Test St",
  city: "London",
  postcode: "E1 1AA",
  country: "GB",
};

const pageUrl = "https://www.thepubdb.com/pubs/abc123";

describe("buildPubJsonLd", () => {
  it("builds a minimal BarOrPub block from required fields only", () => {
    const jsonLd = buildPubJsonLd(basePub, pageUrl);

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "BarOrPub",
      name: "The Test Pub",
      url: pageUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: "1 Test St",
        addressLocality: "London",
        postalCode: "E1 1AA",
        addressCountry: "GB",
      },
    });
  });

  it("includes telephone, sameAs, and image when present", () => {
    const jsonLd = buildPubJsonLd(
      { ...basePub, phone: "020 1234 5678", website: "https://testpub.example", imageUrl: "https://img.example/pub.jpg" },
      pageUrl
    );

    expect(jsonLd.telephone).toBe("020 1234 5678");
    expect(jsonLd.sameAs).toBe("https://testpub.example");
    expect(jsonLd.image).toBe("https://img.example/pub.jpg");
  });

  it("includes geo coordinates only when both lat and lng are present", () => {
    expect(buildPubJsonLd({ ...basePub, lat: 51.5, lng: -0.1 }, pageUrl).geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 51.5,
      longitude: -0.1,
    });
    expect(buildPubJsonLd({ ...basePub, lat: 51.5 }, pageUrl).geo).toBeUndefined();
    expect(buildPubJsonLd({ ...basePub, lng: -0.1 }, pageUrl).geo).toBeUndefined();
  });

  it("converts opening hours into schema.org OpeningHoursSpecification entries, skipping closed days", () => {
    const jsonLd = buildPubJsonLd(
      {
        ...basePub,
        openingHours: {
          monday: { open: "12:00", close: "23:00" },
          tuesday: { closed: true },
          sunday: { open: "12:00", close: "22:30" },
        },
      },
      pageUrl
    );

    expect(jsonLd.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Monday",
        opens: "12:00",
        closes: "23:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Sunday",
        opens: "12:00",
        closes: "22:30",
      },
    ]);
  });

  it("omits openingHoursSpecification when no hours are recorded", () => {
    const jsonLd = buildPubJsonLd(basePub, pageUrl);
    expect(jsonLd.openingHoursSpecification).toBeUndefined();
  });

  it("omits openingHoursSpecification when every day is closed or incomplete", () => {
    const jsonLd = buildPubJsonLd(
      { ...basePub, openingHours: { monday: { closed: true }, tuesday: { open: "12:00" } } },
      pageUrl
    );
    expect(jsonLd.openingHoursSpecification).toBeUndefined();
  });
});
