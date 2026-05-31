import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Pub } from "@/types/pub";
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

    it('renders "—" when area is not set', () => {
      renderView({ area: undefined });
      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("renders the area when set", () => {
      renderView({ area: "Covent Garden" });
      expect(screen.getByText(/Covent Garden/)).toBeInTheDocument();
    });

    it("renders the website as an external link", () => {
      renderView({ website: "https://theharp.co.uk" });
      const link = screen.getByRole("link", { name: "https://theharp.co.uk" });
      expect(link).toHaveAttribute("href", "https://theharp.co.uk");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it('renders "—" when website is not set', () => {
      renderView({ website: undefined });
      expect(screen.getByText("Website")).toBeInTheDocument();
    });

    it("renders lat and lng when present", () => {
      renderView({ lat: 51.5, lng: -0.12 });
      expect(screen.getByText(/51.5/)).toBeInTheDocument();
      expect(screen.getByText(/-0.12/)).toBeInTheDocument();
    });

    it("renders the createdAt date in ISO format", () => {
      renderView();
      expect(screen.getByText("2023-01-15")).toBeInTheDocument();
    });
  });

  describe("boolean amenity fields", () => {
    it.each([
      ["isIndependent", "Independent"],
      ["hasFood", "Food available"],
      ["hasSundayRoast", "Sunday roast"],
      ["hasBeerGarden", "Beer garden"],
      ["hasCaskAle", "Cask ale"],
      ["isBeerFocused", "Beer-focused"],
      ["isDogFriendly", "Dog friendly"],
      ["isFamilyFriendly", "Family friendly"],
      ["hasStepFreeAccess", "Step-free access"],
      ["hasAccessibleToilet", "Accessible toilet"],
      ["hasLiveSport", "Live sport"],
      ["hasLiveMusic", "Live music"],
      ["hasPoolTable", "Pool table"],
      ["hasDartsBoard", "Darts board"],
    ] as const)('renders "%s" as an inactive chip when unset', (_field, label) => {
      renderView();
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
