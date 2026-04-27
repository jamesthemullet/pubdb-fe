import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BeerGarden, OpeningHoursMap, Pub } from "@/types/pub";
import PubDisplayView from "./PubDisplayView";

const BASE_PUB: Pub = {
  id: "pub-1",
  name: "The Harp",
  city: "London",
  address: "47 Chandos Place",
  postcode: "WC2N 4HS",
  country: "GB",
  createdAt: "2023-01-15T10:00:00Z",
};

function renderView(
  overrides: Partial<Pub> = {},
  getCountryName = vi.fn((code: string) => code)
) {
  const pub = { ...BASE_PUB, ...overrides };
  render(<PubDisplayView pub={pub} getCountryName={getCountryName} />);
  return { pub, getCountryName };
}

describe("PubDisplayView", () => {
  describe("core fields", () => {
    it("renders the city", () => {
      renderView();
      expect(screen.getByText(/London/)).toBeInTheDocument();
    });

    it("calls getCountryName with the country code and renders the result", () => {
      const getCountryName = vi.fn().mockReturnValue("United Kingdom");
      renderView({}, getCountryName);
      expect(getCountryName).toHaveBeenCalledWith("GB");
      expect(screen.getByText(/United Kingdom/)).toBeInTheDocument();
    });

    it("renders the address", () => {
      renderView();
      expect(screen.getByText(/47 Chandos Place/)).toBeInTheDocument();
    });

    it("renders the postcode", () => {
      renderView();
      expect(screen.getByText(/WC2N 4HS/)).toBeInTheDocument();
    });

    it('renders "-" when area is not set', () => {
      renderView({ area: undefined });
      expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    });

    it("renders the area when set", () => {
      renderView({ area: "Covent Garden" });
      expect(screen.getByText(/Covent Garden/)).toBeInTheDocument();
    });

    it("renders the website as an external link", () => {
      renderView({ website: "https://theharp.co.uk" });
      const link = screen.getByRole("link", { name: "Visit The Harp website (opens in new tab)" });
      expect(link).toHaveAttribute("href", "https://theharp.co.uk");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it('renders "-" when website is not set', () => {
      renderView({ website: undefined });
      expect(screen.getByText("Website:")).toBeInTheDocument();
    });

    it("renders lat and lng when present", () => {
      renderView({ lat: 51.5, lng: -0.12 });
      expect(screen.getByText(/51.5/)).toBeInTheDocument();
      expect(screen.getByText(/-0.12/)).toBeInTheDocument();
    });

    it("renders the createdAt date", () => {
      renderView();
      expect(
        screen.getByText(
          new RegExp(new Date("2023-01-15T10:00:00Z").toLocaleString(), "i")
        )
      ).toBeInTheDocument();
    });
  });

  describe("boolean amenity fields", () => {
    it.each([
      ["isIndependent", "Independent:"],
      ["hasFood", "Food available:"],
      ["hasSundayRoast", "Sunday roast:"],
      ["hasBeerGarden", "Beer garden:"],
      ["hasCaskAle", "Cask ale:"],
      ["isBeerFocused", "Beer-focused:"],
      ["isDogFriendly", "Dog friendly:"],
      ["isFamilyFriendly", "Family friendly:"],
      ["hasStepFreeAccess", "Step-free access:"],
      ["hasAccessibleToilet", "Accessible toilet:"],
      ["hasLiveSport", "Live sport:"],
      ["hasLiveMusic", "Live music:"],
    ] as const)('renders "%s" label', (_field, label) => {
      renderView();
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("renders Yes for a true boolean field", () => {
      renderView({ hasFood: true });
      expect(screen.getByText(/Food available:/)).toBeInTheDocument();
      const items = screen.getAllByText("Yes");
      expect(items.length).toBeGreaterThan(0);
    });

    it("renders No for a false boolean field", () => {
      renderView({ isDogFriendly: false });
      const items = screen.getAllByText("No");
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("beer types", () => {
    it('renders "-" when no beer types are set', () => {
      renderView({ beerTypes: [], beerType: null, beerTypeIds: [] });
      expect(screen.getByText("Beer Types:")).toBeInTheDocument();
    });

    it("renders beer type names from beerTypes array with beerType.name", () => {
      renderView({
        beerTypes: [
          { beerTypeId: "bt1", beerType: { id: "bt1", name: "Ale" } },
          { beerTypeId: "bt2", beerType: { id: "bt2", name: "Stout" } },
        ],
      });
      expect(screen.getByText(/Ale, Stout/)).toBeInTheDocument();
    });

    it("falls back to beerTypeId when beerType is null", () => {
      renderView({
        beerTypes: [{ beerTypeId: "bt-unknown", beerType: null }],
      });
      expect(screen.getByText(/bt-unknown/)).toBeInTheDocument();
    });

    it("renders name from a BeerType entry (without beerType nesting)", () => {
      renderView({
        beerTypes: [{ id: "bt1", name: "IPA" }],
      });
      expect(screen.getByText(/IPA/)).toBeInTheDocument();
    });

    it("renders a single beer type from the beerType string field", () => {
      renderView({ beerTypes: undefined, beerType: "Real Ale" });
      expect(screen.getByText(/Real Ale/)).toBeInTheDocument();
    });

    it("renders a single beer type from the beerType object field", () => {
      renderView({
        beerTypes: undefined,
        beerType: { id: "bt1", name: "Porter" },
      });
      expect(screen.getByText(/Porter/)).toBeInTheDocument();
    });

    it("renders beer types from the beerTypeIds array", () => {
      renderView({
        beerTypes: undefined,
        beerType: undefined,
        beerTypeIds: ["id-a", "id-b"],
      });
      expect(screen.getByText(/id-a, id-b/)).toBeInTheDocument();
    });
  });

  describe("opening hours", () => {
    it('renders "-" when openingHours is not set', () => {
      renderView({ openingHours: undefined });
      expect(screen.getByText("Opening Hours:")).toBeInTheDocument();
    });

    it("renders all weekdays with times from an opening hours object", () => {
      const oh: OpeningHoursMap = {
        monday: { open: "11:00", close: "23:00" },
        tuesday: { open: "11:00", close: "23:00" },
        wednesday: { open: "11:00", close: "23:00" },
        thursday: { open: "11:00", close: "23:00" },
        friday: { open: "12:00", close: "00:00" },
        saturday: { open: "12:00", close: "00:00" },
        sunday: { open: "12:00", close: "22:00" },
      };
      renderView({ openingHours: oh });
      expect(screen.getByText(/Monday:/)).toBeInTheDocument();
      // Multiple days share the same time, so use getAllByText
      expect(screen.getAllByText(/11:00 – 23:00/).length).toBeGreaterThan(0);
    });

    it("renders Closed for days marked as closed", () => {
      const oh: OpeningHoursMap = {
        monday: { closed: true },
      };
      renderView({ openingHours: oh });
      expect(screen.getByText(/Closed/)).toBeInTheDocument();
    });

    it("renders opening hours when provided as a JSON string", () => {
      const oh = JSON.stringify({ friday: { open: "17:00", close: "23:00" } });
      // openingHours accepts string in the component internals, cast through unknown
      renderView({ openingHours: oh as unknown as OpeningHoursMap });
      expect(screen.getByText(/Friday:/)).toBeInTheDocument();
      expect(screen.getByText(/17:00 – 23:00/)).toBeInTheDocument();
    });

    it('renders "-" for days not present in the opening hours map', () => {
      const oh: OpeningHoursMap = {
        monday: { open: "11:00", close: "23:00" },
      };
      renderView({ openingHours: oh });
      expect(screen.getByText(/Tuesday:/)).toBeInTheDocument();
    });

    it("handles upper-case keys in the opening hours map", () => {
      const oh = {
        MONDAY: { open: "09:00", close: "17:00" },
      } as unknown as OpeningHoursMap;
      renderView({ openingHours: oh });
      expect(screen.getByText(/09:00 – 17:00/)).toBeInTheDocument();
    });
  });

  describe("beer gardens", () => {
    const SAMPLE_GARDEN: BeerGarden = {
      id: "g1",
      name: "Back Terrace",
      description: "Lovely spot",
      seatingCapacity: 20,
      sunExposure: "FULL_SUN",
      isCovered: true,
      isHeated: false,
      isFamilyFriendly: true,
      petFriendly: false,
    };

    it('renders "-" when there are no beer gardens', () => {
      renderView({ beerGardens: [] });
      expect(screen.getByText("Beer Gardens:")).toBeInTheDocument();
    });

    it("renders the beer garden name", () => {
      renderView({ beerGardens: [SAMPLE_GARDEN] });
      expect(screen.getByText("Back Terrace")).toBeInTheDocument();
    });

    it("renders the beer garden description", () => {
      renderView({ beerGardens: [SAMPLE_GARDEN] });
      expect(screen.getByText(/Lovely spot/)).toBeInTheDocument();
    });

    it("renders the seating capacity", () => {
      renderView({ beerGardens: [SAMPLE_GARDEN] });
      // Use a custom matcher to find the <p> element that shows the capacity label + value
      expect(
        screen.getByText(
          (_, el) =>
            el?.tagName === "P" &&
            (el.textContent ?? "").includes("Seating capacity") &&
            (el.textContent ?? "").includes("20")
        )
      ).toBeInTheDocument();
    });

    it("renders isCovered as Yes/No", () => {
      renderView({ beerGardens: [{ ...SAMPLE_GARDEN, isCovered: true }] });
      const items = screen.getAllByText("Yes");
      expect(items.length).toBeGreaterThan(0);
    });

    it("renders petFriendly as No when false", () => {
      renderView({ beerGardens: [{ ...SAMPLE_GARDEN, petFriendly: false }] });
      const items = screen.getAllByText("No");
      expect(items.length).toBeGreaterThan(0);
    });

    it("renders the garden image as a link when imageUrl is set", () => {
      renderView({
        beerGardens: [
          { ...SAMPLE_GARDEN, imageUrl: "https://example.com/g.jpg" },
        ],
      });
      const link = screen.getByRole("link", {
        name: "View Back Terrace image (opens in new tab)",
      });
      expect(link).toHaveAttribute("href", "https://example.com/g.jpg");
    });

    it("renders multiple gardens", () => {
      renderView({
        beerGardens: [
          SAMPLE_GARDEN,
          { ...SAMPLE_GARDEN, id: "g2", name: "Front Patio" },
        ],
      });
      expect(screen.getByText("Back Terrace")).toBeInTheDocument();
      expect(screen.getByText("Front Patio")).toBeInTheDocument();
    });
  });
});
