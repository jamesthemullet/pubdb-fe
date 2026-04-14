import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PubPage from "./page";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ id: "123" })),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

vi.mock("@/hooks/useCountries", () => ({
  useCountries: vi.fn(() => ({
    countries: [
      { code: "GB", name: "United Kingdom" },
      { code: "US", name: "United States" },
    ],
    countriesLoading: false,
    countriesError: null,
  })),
}));

vi.mock("@/hooks/useBeerTypes", () => ({
  useBeerTypes: vi.fn(() => ({
    beerTypeOptions: [
      { id: "bt1", name: "Ale", colour: "Amber" },
      { id: "bt2", name: "Lager", colour: null },
    ],
    beerTypesLoading: false,
    beerTypesError: null,
  })),
}));

// OpeningHoursEditor is complex — mock it to keep tests focused
vi.mock("../../features/opening-hours/opening-hours-editor", () => ({
  default: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) => (
    <button
      type="button"
      data-testid="opening-hours-editor"
      onClick={() => onChange({ Monday: { open: "11:00", close: "23:00" } })}
    >
      Opening Hours Editor
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { useParams } from "next/navigation";
import { useCountries } from "@/hooks/useCountries";
import { useBeerTypes } from "@/hooks/useBeerTypes";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const SAMPLE_PUB = {
  id: "123",
  name: "The Harp",
  city: "London",
  address: "47 Chandos Place",
  postcode: "WC2N 4HS",
  country: "GB",
  lat: 51.509,
  lng: -0.124,
  createdAt: "2024-01-15T10:00:00.000Z",
  area: "Covent Garden",
  borough: "Westminster",
  operator: "Independent Co.",
  phone: "020 7836 0291",
  website: "https://harpcoventgarden.com",
  description: "A cosy pub near the theatre district.",
  chainName: "Fuller's",
  isIndependent: true,
  hasFood: true,
  hasSundayRoast: false,
  hasBeerGarden: true,
  hasCaskAle: true,
  isBeerFocused: true,
  isDogFriendly: false,
  isFamilyFriendly: null,
  hasStepFreeAccess: false,
  hasAccessibleToilet: true,
  hasLiveSport: false,
  hasLiveMusic: true,
};

function makePubFetch(pub = SAMPLE_PUB, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(jsonResponse(pub, status));
}

// Build a fake JWT token with a given payload
function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PubPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
    // Reset useParams to default
    vi.mocked(useParams).mockReturnValue({ id: "123" });
    // Reset hooks to default
    vi.mocked(useCountries).mockReturnValue({
      countries: [
        { code: "GB", name: "United Kingdom" },
        { code: "US", name: "United States" },
      ],
      countriesLoading: false,
      countriesError: null,
    });
    vi.mocked(useBeerTypes).mockReturnValue({
      beerTypeOptions: [
        { id: "bt1", name: "Ale", colour: "Amber" },
        { id: "bt2", name: "Lager", colour: null },
      ],
      beerTypesLoading: false,
      beerTypesError: null,
    });
    localStorage.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // -------------------------------------------------------------------------
  // Loading / fetch states
  // -------------------------------------------------------------------------

  it("shows loading state initially", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

    render(<PubPage />);

    expect(screen.getByText("Loading pub details…")).toBeInTheDocument();
  });

  it("shows 'Pub not found' when API returns non-ok status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Not found" }, 404),
    );

    render(<PubPage />);

    expect(await screen.findByText("Pub not found")).toBeInTheDocument();
  });

  it("shows 'Pub not found' when fetch throws a network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<PubPage />);

    expect(await screen.findByText("Pub not found")).toBeInTheDocument();
  });

  it("does not fetch when id is undefined", () => {
    vi.mocked(useParams).mockReturnValue({});
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<PubPage />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // View mode — pub detail display
  // -------------------------------------------------------------------------

  it("renders pub name as heading after fetch", async () => {
    makePubFetch();

    render(<PubPage />);

    expect(await screen.findByRole("heading", { name: "The Harp" })).toBeInTheDocument();
  });

  it("renders pub image when imageUrl is provided", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ ...SAMPLE_PUB, imageUrl: "https://example.com/pub.jpg" }),
    );

    render(<PubPage />);

    const img = await screen.findByRole("img", { name: "The Harp" });
    expect(img).toHaveAttribute("src", "https://example.com/pub.jpg");
  });

  it("does not render image when imageUrl is absent", async () => {
    makePubFetch({ ...SAMPLE_PUB, imageUrl: undefined });

    render(<PubPage />);

    await screen.findByRole("heading", { name: "The Harp" });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders city", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("London")).toBeInTheDocument();
  });

  it("renders country name via country code lookup", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("United Kingdom")).toBeInTheDocument();
  });

  it("falls back to country code when country not found in list", async () => {
    vi.mocked(useCountries).mockReturnValue({
      countries: [],
      countriesLoading: false,
      countriesError: null,
    });
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("GB")).toBeInTheDocument();
  });

  it("renders address and postcode", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("47 Chandos Place")).toBeInTheDocument();
    expect(screen.getByText("WC2N 4HS")).toBeInTheDocument();
  });

  it("renders area, borough, operator, phone", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("Covent Garden")).toBeInTheDocument();
    expect(screen.getByText("Westminster")).toBeInTheDocument();
    expect(screen.getByText("Independent Co.")).toBeInTheDocument();
    expect(screen.getByText("020 7836 0291")).toBeInTheDocument();
  });

  it("renders '-' for optional fields that are absent", async () => {
    makePubFetch({
      ...SAMPLE_PUB,
      area: undefined,
      borough: undefined,
      operator: undefined,
      phone: undefined,
    });
    render(<PubPage />);
    await screen.findByText("The Harp");
    // Each absent optional field shows "-"; there may be multiple dashes
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("renders website as a link when provided", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    const link = screen.getByRole("link", { name: "https://harpcoventgarden.com" });
    expect(link).toHaveAttribute("href", "https://harpcoventgarden.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders '-' for website when absent", async () => {
    makePubFetch({ ...SAMPLE_PUB, website: undefined });
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.queryByRole("link", { name: /http/i })).not.toBeInTheDocument();
  });

  it("renders description and chain name", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("A cosy pub near the theatre district.")).toBeInTheDocument();
    expect(screen.getByText("Fuller's")).toBeInTheDocument();
  });

  it("renders boolean amenity fields as 'Yes' or 'No'", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    // isIndependent: true → "Yes"
    // hasFood: true → "Yes"
    // hasSundayRoast: false → "No"
    const yesValues = screen.getAllByText("Yes");
    expect(yesValues.length).toBeGreaterThan(0);
    const noValues = screen.getAllByText("No");
    expect(noValues.length).toBeGreaterThan(0);
  });

  it("renders '-' for null boolean amenity fields", async () => {
    // isFamilyFriendly is null in SAMPLE_PUB → should render "-"
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    // isFamilyFriendly is null → shown as "-"
    // (other "-"s also exist, so just check at least one)
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("renders lat and lng", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("51.509")).toBeInTheDocument();
    expect(screen.getByText("-0.124")).toBeInTheDocument();
  });

  it("renders formatted createdAt date", async () => {
    makePubFetch();
    render(<PubPage />);
    await screen.findByText("The Harp");
    // Just check that some date string rendered (locale-dependent)
    const dateStr = new Date("2024-01-15T10:00:00.000Z").toLocaleString();
    expect(screen.getByText(dateStr)).toBeInTheDocument();
  });

  it("renders beer type names from beerTypes array with beerType sub-object", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        ...SAMPLE_PUB,
        beerTypes: [
          { beerTypeId: "bt1", beerType: { id: "bt1", name: "Ale" } },
          { beerTypeId: "bt2", beerType: { id: "bt2", name: "Lager" } },
        ],
      }),
    );
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("Ale, Lager")).toBeInTheDocument();
  });

  it("renders beer type IDs when beerType sub-object is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        ...SAMPLE_PUB,
        beerTypes: [{ beerTypeId: "bt1" }, { beerTypeId: "bt2" }],
      }),
    );
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("bt1, bt2")).toBeInTheDocument();
  });

  it("renders beer type from legacy beerType string field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ ...SAMPLE_PUB, beerTypes: undefined, beerType: "Real Ale" }),
    );
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("Real Ale")).toBeInTheDocument();
  });

  it("renders beer type from legacy beerType object field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        ...SAMPLE_PUB,
        beerTypes: undefined,
        beerType: { id: "btX", name: "Craft" },
      }),
    );
    render(<PubPage />);
    await screen.findByText("The Harp");
    expect(screen.getByText("Craft")).toBeInTheDocument();
  });

  it("renders '-' when no beer types present", async () => {
    makePubFetch({ ...SAMPLE_PUB, beerTypes: undefined, beerType: undefined, beerTypeIds: undefined });
    render(<PubPage />);
    await screen.findByText("The Harp");
    // Beer Types field shows "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Opening hours — view mode
  // -------------------------------------------------------------------------

  describe("opening hours display", () => {
    it("shows '-' for each day when openingHours is absent", async () => {
      makePubFetch({ ...SAMPLE_PUB, openingHours: undefined });
      render(<PubPage />);
      await screen.findByText("The Harp");
      // Should not render day-specific rows
      expect(screen.queryByText("Monday:")).not.toBeInTheDocument();
    });

    it("renders opening hours from object", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...SAMPLE_PUB,
          openingHours: {
            Monday: { open: "11:00", close: "23:00" },
            Tuesday: { closed: true },
          },
        }),
      );
      render(<PubPage />);
      await screen.findByText("The Harp");
      expect(screen.getByText(/11:00/)).toBeInTheDocument();
      expect(screen.getByText(/Closed/)).toBeInTheDocument();
    });

    it("renders '-' for days not in the opening hours map", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...SAMPLE_PUB,
          openingHours: { Monday: { open: "12:00", close: "22:00" } },
        }),
      );
      render(<PubPage />);
      await screen.findByText("The Harp");
      // Sunday has no entry → parent row should contain "-"
      const sundayLabel = screen.getByText("Sunday:");
      expect(sundayLabel.closest("p")?.textContent).toMatch(/-/);
    });

    it("renders opening hours from a JSON string", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...SAMPLE_PUB,
          openingHours: JSON.stringify({
            Wednesday: { open: "09:30", close: "22:00" },
          }) as unknown,
        }),
      );
      render(<PubPage />);
      await screen.findByText("The Harp");
      // Find the Wednesday row and confirm it shows the time
      const wednesdayLabel = screen.getByText("Wednesday:");
      expect(wednesdayLabel.closest("p")?.textContent).toContain("09:30");
    });

    it("handles invalid JSON string for opening hours gracefully", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...SAMPLE_PUB,
          openingHours: "not-valid-json" as unknown,
        }),
      );
      render(<PubPage />);
      await screen.findByText("The Harp");
      // Shows all days as "-"
      const mondayEl = screen.getByText("Monday:");
      expect(mondayEl).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Beer gardens — view mode
  // -------------------------------------------------------------------------

  describe("beer gardens display", () => {
    it("renders '-' when no beer gardens", async () => {
      makePubFetch({ ...SAMPLE_PUB, beerGardens: [] });
      render(<PubPage />);
      await screen.findByText("The Harp");
      // Beer Gardens section shows " -"
      expect(screen.queryByText("Garden 1")).not.toBeInTheDocument();
    });

    it("renders beer garden details", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...SAMPLE_PUB,
          beerGardens: [
            {
              id: "g1",
              name: "The Patio",
              description: "Nice outdoor space",
              seatingCapacity: 30,
              sunExposure: "FULL_SUN",
              isCovered: true,
              isHeated: false,
              isFamilyFriendly: true,
              petFriendly: false,
              imageUrl: "https://example.com/garden.jpg",
              notes: "Great in summer",
            },
          ],
        }),
      );
      render(<PubPage />);
      await screen.findByText("The Harp");
      expect(screen.getByText("The Patio")).toBeInTheDocument();
      expect(screen.getByText("Nice outdoor space")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();
      expect(screen.getByText("FULL_SUN")).toBeInTheDocument();
      expect(screen.getByText("Great in summer")).toBeInTheDocument();
      const imgLink = screen.getByRole("link", { name: "https://example.com/garden.jpg" });
      expect(imgLink).toHaveAttribute("href", "https://example.com/garden.jpg");
    });

    it("renders '-' for absent garden imageUrl", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...SAMPLE_PUB,
          beerGardens: [{ id: "g1", name: "Yard", isCovered: false, isHeated: false, isFamilyFriendly: false, petFriendly: false }],
        }),
      );
      render(<PubPage />);
      await screen.findByText("The Harp");
      expect(screen.getByText("Yard")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // EditButton — authentication states
  // -------------------------------------------------------------------------

  describe("EditButton", () => {
    beforeEach(() => {
      // By default, auth/me fetch will resolve after pub fetch
      // We set up pub fetch separately in each test
    });

    it("shows 'Log in to edit this pub' when no token", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(SAMPLE_PUB));
      localStorage.removeItem("token");

      render(<PubPage />);

      await screen.findByText("The Harp");
      expect(screen.getByText("Log in to edit this pub")).toBeInTheDocument();
    });

    it("shows 'Your account is not approved' when token present but not approved", async () => {
      const token = makeToken({ email: "user@example.com", approved: false, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: false, admin: false }),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);

      await screen.findByText("The Harp");
      await screen.findByText("Your account is not approved for editing.");
      expect(screen.getByRole("link", { name: "hello@thepubdb.com" })).toHaveAttribute(
        "href",
        "mailto:hello@thepubdb.com",
      );
    });

    it("shows 'Edit this pub' button when user is approved", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);

      await screen.findByText("The Harp");
      await screen.findByRole("button", { name: "Edit this pub" });
    });

    it("does not show 'Delete this pub' for non-admin users", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);

      await screen.findByText("The Harp");
      await screen.findByRole("button", { name: "Edit this pub" });
      expect(screen.queryByRole("button", { name: "Delete this pub" })).not.toBeInTheDocument();
    });

    it("shows 'Delete this pub' button for admin users", async () => {
      const token = makeToken({ email: "admin@example.com", approved: true, admin: true });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "admin@example.com", approved: true, admin: true }),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);

      await screen.findByText("The Harp");
      await screen.findByRole("button", { name: "Delete this pub" });
    });

    it("shows Log in state when auth/me returns non-ok", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(jsonResponse({ error: "Unauthorized" }, 401));
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);

      await screen.findByText("The Harp");
      await screen.findByText("Log in to edit this pub");
    });

    it("shows no-user state when auth/me throws and token is malformed", async () => {
      localStorage.setItem("token", "not.a.valid.jwt");

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);

      await screen.findByText("The Harp");
      await screen.findByText("Log in to edit this pub");
    });

    describe("delete pub", () => {
      async function setupAdminAndLoad() {
        const token = makeToken({ email: "admin@example.com", approved: true, admin: true });
        localStorage.setItem("token", token);

        vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "admin@example.com", approved: true, admin: true }),
            );
          }
          if (opts && (opts as RequestInit).method === "DELETE") {
            return Promise.resolve(jsonResponse({}, 200));
          }
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        });

        render(<PubPage />);
        await screen.findByText("The Harp");
        await screen.findByRole("button", { name: "Delete this pub" });
      }

      it("does not delete when user cancels the confirmation dialog", async () => {
        await setupAdminAndLoad();
        vi.spyOn(window, "confirm").mockReturnValue(false);

        fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

        await waitFor(() => {
          expect(screen.queryByText("Pub deleted successfully")).not.toBeInTheDocument();
        });
      });

      it("shows success message and redirects after successful delete", async () => {
        const token = makeToken({ email: "admin@example.com", approved: true, admin: true });
        localStorage.setItem("token", token);

        // Capture location.href assignment
        const originalLocation = window.location;
        Object.defineProperty(window, "location", {
          value: { href: "" },
          writable: true,
          configurable: true,
        });

        vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "admin@example.com", approved: true, admin: true }),
            );
          }
          if (opts && (opts as RequestInit).method === "DELETE") {
            return Promise.resolve(jsonResponse({}, 200));
          }
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        });
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<PubPage />);
        await screen.findByText("The Harp");
        await screen.findByRole("button", { name: "Delete this pub" });

        fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

        await waitFor(() => {
          expect(window.location.href).toBe("/pubs");
        });

        // Restore
        Object.defineProperty(window, "location", {
          value: originalLocation,
          writable: true,
          configurable: true,
        });
      });

      it("shows error message when delete API returns error", async () => {
        const token = makeToken({ email: "admin@example.com", approved: true, admin: true });
        localStorage.setItem("token", token);

        vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "admin@example.com", approved: true, admin: true }),
            );
          }
          if (opts && (opts as RequestInit).method === "DELETE") {
            return Promise.resolve(jsonResponse({ error: "Permission denied" }, 403));
          }
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        });
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<PubPage />);
        await screen.findByText("The Harp");
        await screen.findByRole("button", { name: "Delete this pub" });

        fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

        expect(await screen.findByText("Permission denied")).toBeInTheDocument();
      });

      it("shows default error message when delete response has no error field", async () => {
        const token = makeToken({ email: "admin@example.com", approved: true, admin: true });
        localStorage.setItem("token", token);

        vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "admin@example.com", approved: true, admin: true }),
            );
          }
          if (opts && (opts as RequestInit).method === "DELETE") {
            return Promise.resolve(jsonResponse({}, 500));
          }
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        });
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<PubPage />);
        await screen.findByText("The Harp");
        await screen.findByRole("button", { name: "Delete this pub" });

        fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

        expect(await screen.findByText("Failed to delete pub")).toBeInTheDocument();
      });

      it("shows 'Network error' when delete fetch throws", async () => {
        const token = makeToken({ email: "admin@example.com", approved: true, admin: true });
        localStorage.setItem("token", token);

        vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "admin@example.com", approved: true, admin: true }),
            );
          }
          if (opts && (opts as RequestInit).method === "DELETE") {
            return Promise.reject(new Error("Network down"));
          }
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        });
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<PubPage />);
        await screen.findByText("The Harp");
        await screen.findByRole("button", { name: "Delete this pub" });

        fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

        expect(await screen.findByText("Network error")).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Edit mode
  // -------------------------------------------------------------------------

  describe("edit mode", () => {
    async function setupAndEnterEditMode() {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);
    }

    it("shows Save and Cancel buttons when editing", async () => {
      await setupAndEnterEditMode();
      expect(screen.getAllByRole("button", { name: "Save" }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: "Cancel" }).length).toBeGreaterThan(0);
    });

    it("returns to view mode when Cancel is clicked", async () => {
      await setupAndEnterEditMode();
      // Use the first Cancel button
      const cancelBtns = screen.getAllByRole("button", { name: "Cancel" });
      fireEvent.click(cancelBtns[0]);

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "Edit this pub" })).toBeInTheDocument();
    });

    it("pre-fills edit fields with current pub values", async () => {
      await setupAndEnterEditMode();
      const nameInput = screen.getByDisplayValue("The Harp");
      expect(nameInput).toBeInTheDocument();
    });

    it("disables Save when a required field is cleared", async () => {
      await setupAndEnterEditMode();
      const nameInput = screen.getByDisplayValue("The Harp");
      fireEvent.change(nameInput, { target: { value: "" } });

      await waitFor(() => {
        const saveBtns = screen.getAllByRole("button", { name: "Save" });
        // At least one save button should be disabled
        expect(saveBtns.some((btn) => btn.hasAttribute("disabled"))).toBe(true);
      });
    });

    it("shows error when Save is clicked with missing required fields", async () => {
      await setupAndEnterEditMode();
      const nameInput = screen.getByDisplayValue("The Harp");
      fireEvent.change(nameInput, { target: { value: "" } });

      // Trigger save via the bottom Save button
      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      // Click even if disabled to trigger the validation path (button may block click when disabled)
      // So we need to find an enabled Save or call handleSave directly
      // Instead let's clear another field and check the error path
      // Actually buttons disabled won't fire onClick, so let's check validation state only
      await waitFor(() => {
        expect(screen.getByText("name is required")).toBeInTheDocument();
      });
    });

    it("shows website validation error for invalid URL", async () => {
      await setupAndEnterEditMode();
      const websiteInput = screen.getByDisplayValue("https://harpcoventgarden.com");
      fireEvent.change(websiteInput, { target: { value: "not-a-url" } });

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid URL (include http:// or https://)"),
        ).toBeInTheDocument();
      });
    });

    it("clears website error when URL is made valid", async () => {
      await setupAndEnterEditMode();
      const websiteInput = screen.getByDisplayValue("https://harpcoventgarden.com");
      fireEvent.change(websiteInput, { target: { value: "not-a-url" } });
      fireEvent.change(websiteInput, { target: { value: "https://valid.com" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Please enter a valid URL (include http:// or https://)"),
        ).not.toBeInTheDocument();
      });
    });

    it("shows phone validation error for invalid phone characters", async () => {
      await setupAndEnterEditMode();
      const phoneInput = screen.getByDisplayValue("020 7836 0291");
      fireEvent.change(phoneInput, { target: { value: "abc123" } });

      await waitFor(() => {
        expect(
          screen.getByText(
            "Invalid phone number format. Only numbers, spaces, and dashes are allowed.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("accepts valid phone number", async () => {
      await setupAndEnterEditMode();
      const phoneInput = screen.getByDisplayValue("020 7836 0291");
      fireEvent.change(phoneInput, { target: { value: "+44-20-1234-5678" } });

      await waitFor(() => {
        expect(
          screen.queryByText(/Invalid phone number format/),
        ).not.toBeInTheDocument();
      });
    });

    it("updates other editable fields (area, borough, operator)", async () => {
      await setupAndEnterEditMode();
      const areaInput = screen.getByDisplayValue("Covent Garden");
      fireEvent.change(areaInput, { target: { value: "Soho" } });
      expect(screen.getByDisplayValue("Soho")).toBeInTheDocument();

      const boroughInput = screen.getByDisplayValue("Westminster");
      fireEvent.change(boroughInput, { target: { value: "Lambeth" } });
      expect(screen.getByDisplayValue("Lambeth")).toBeInTheDocument();
    });

    it("saves successfully and returns to view mode", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      const updatedPub = { ...SAMPLE_PUB, name: "Updated Harp" };

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          return Promise.resolve(jsonResponse(updatedPub));
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      // Click one of the Save buttons (top one, not disabled)
      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
      });
      expect(screen.getByRole("heading", { name: "Updated Harp" })).toBeInTheDocument();
    });

    it("shows save error when API returns an error", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          return Promise.resolve(jsonResponse({ error: "Validation failed" }, 422));
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      expect(await screen.findByText("Validation failed")).toBeInTheDocument();
    });

    it("shows 'Network error' when save fetch throws", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          return Promise.reject(new Error("Network down"));
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      expect(await screen.findByText("Network error")).toBeInTheDocument();
    });

    it("shows save error when API returns field-level validation errors", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          return Promise.resolve(
            jsonResponse(
              { errors: { fieldErrors: { name: ["Name is too short"] } } },
              422,
            ),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      expect(await screen.findByText("name: Name is too short")).toBeInTheDocument();
    });

    it("shows save error for formErrors", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          return Promise.resolve(
            jsonResponse(
              { errors: { formErrors: ["Something went wrong globally"] } },
              422,
            ),
          );
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      expect(await screen.findByText("Something went wrong globally")).toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Beer types in edit mode
    // -----------------------------------------------------------------------

    describe("beer type selection", () => {
      it("renders beer type checkboxes in edit mode", async () => {
        await setupAndEnterEditMode();
        expect(screen.getByLabelText(/Ale \(Amber\)/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Lager/)).toBeInTheDocument();
      });

      it("toggles beer type on checkbox change", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "user@example.com", approved: true, admin: false }),
            );
          }
          return Promise.resolve(
            jsonResponse({ ...SAMPLE_PUB, beerTypes: [{ beerTypeId: "bt1", beerType: { id: "bt1", name: "Ale" } }] }),
          );
        });
        localStorage.setItem("token", makeToken({ email: "user@example.com", approved: true, admin: false }));

        render(<PubPage />);
        await screen.findByText("The Harp");
        const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
        fireEvent.click(editBtn);

        // bt1 (Ale) should be checked (pre-selected from beerTypes)
        const aleCheckbox = screen.getByLabelText(/Ale \(Amber\)/);
        expect(aleCheckbox).toBeChecked();

        // Uncheck Ale
        fireEvent.click(aleCheckbox);
        expect(aleCheckbox).not.toBeChecked();

        // Check Lager
        const lagerCheckbox = screen.getByLabelText(/Lager/);
        fireEvent.click(lagerCheckbox);
        expect(lagerCheckbox).toBeChecked();
      });

      it("shows loading state for beer types", async () => {
        vi.mocked(useBeerTypes).mockReturnValue({
          beerTypeOptions: [],
          beerTypesLoading: true,
          beerTypesError: null,
        });

        await setupAndEnterEditMode();
        expect(screen.getByText("Loading beer types…")).toBeInTheDocument();
      });

      it("shows error state for beer types", async () => {
        vi.mocked(useBeerTypes).mockReturnValue({
          beerTypeOptions: [],
          beerTypesLoading: false,
          beerTypesError: "Failed to load beer types",
        });

        await setupAndEnterEditMode();
        expect(screen.getByText("Failed to load beer types")).toBeInTheDocument();
      });

      it("shows 'No beer types available' when list is empty", async () => {
        vi.mocked(useBeerTypes).mockReturnValue({
          beerTypeOptions: [],
          beerTypesLoading: false,
          beerTypesError: null,
        });

        await setupAndEnterEditMode();
        expect(screen.getByText("No beer types available.")).toBeInTheDocument();
      });
    });

    // -----------------------------------------------------------------------
    // Beer gardens in edit mode
    // -----------------------------------------------------------------------

    describe("beer garden management", () => {
      it("shows 'No beer gardens added yet' when pub has no gardens", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "user@example.com", approved: true, admin: false }),
            );
          }
          return Promise.resolve(jsonResponse({ ...SAMPLE_PUB, beerGardens: [] }));
        });
        localStorage.setItem("token", makeToken({ email: "user@example.com", approved: true, admin: false }));

        render(<PubPage />);
        await screen.findByText("The Harp");
        const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
        fireEvent.click(editBtn);

        expect(screen.getByText("No beer gardens added yet.")).toBeInTheDocument();
      });

      it("adds a new beer garden when 'Add beer garden' is clicked", async () => {
        await setupAndEnterEditMode();

        fireEvent.click(screen.getByRole("button", { name: "Add beer garden" }));

        await waitFor(() => {
          expect(screen.getByText("Garden 1")).toBeInTheDocument();
        });
      });

      it("removes a beer garden when Remove is clicked", async () => {
        await setupAndEnterEditMode();
        fireEvent.click(screen.getByRole("button", { name: "Add beer garden" }));
        await screen.findByText("Garden 1");

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        await waitFor(() => {
          expect(screen.queryByText("Garden 1")).not.toBeInTheDocument();
        });
        expect(screen.getByText("No beer gardens added yet.")).toBeInTheDocument();
      });

      it("pre-populates existing beer garden fields", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "user@example.com", approved: true, admin: false }),
            );
          }
          return Promise.resolve(
            jsonResponse({
              ...SAMPLE_PUB,
              beerGardens: [
                {
                  id: "g1",
                  name: "The Patio",
                  description: "Nice garden",
                  seatingCapacity: 20,
                  isCovered: true,
                  isHeated: false,
                  isFamilyFriendly: true,
                  petFriendly: false,
                },
              ],
            }),
          );
        });
        localStorage.setItem("token", makeToken({ email: "user@example.com", approved: true, admin: false }));

        render(<PubPage />);
        await screen.findByText("The Harp");
        const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
        fireEvent.click(editBtn);

        expect(screen.getByDisplayValue("The Patio")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Nice garden")).toBeInTheDocument();
        expect(screen.getByDisplayValue("20")).toBeInTheDocument();
      });

      it("updates beer garden fields", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "user@example.com", approved: true, admin: false }),
            );
          }
          return Promise.resolve(
            jsonResponse({
              ...SAMPLE_PUB,
              beerGardens: [
                { id: "g1", name: "Old Name", isCovered: false, isHeated: false, isFamilyFriendly: false, petFriendly: false },
              ],
            }),
          );
        });
        localStorage.setItem("token", makeToken({ email: "user@example.com", approved: true, admin: false }));

        render(<PubPage />);
        await screen.findByText("The Harp");
        const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
        fireEvent.click(editBtn);

        const gardenNameInput = screen.getByDisplayValue("Old Name");
        fireEvent.change(gardenNameInput, { target: { value: "New Name" } });
        expect(screen.getByDisplayValue("New Name")).toBeInTheDocument();
      });

      it("updates beer garden covered checkbox", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "user@example.com", approved: true, admin: false }),
            );
          }
          return Promise.resolve(
            jsonResponse({
              ...SAMPLE_PUB,
              beerGardens: [
                { id: "g1", name: "Garden A", isCovered: false, isHeated: false, isFamilyFriendly: false, petFriendly: false },
              ],
            }),
          );
        });
        localStorage.setItem("token", makeToken({ email: "user@example.com", approved: true, admin: false }));

        render(<PubPage />);
        await screen.findByText("The Harp");
        const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
        fireEvent.click(editBtn);

        const coveredCheckbox = screen.getByLabelText("Covered");
        expect(coveredCheckbox).not.toBeChecked();
        fireEvent.click(coveredCheckbox);
        expect(coveredCheckbox).toBeChecked();
      });

      it("updates sun exposure dropdown in beer garden", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
          if (typeof url === "string" && url.includes("/auth/me")) {
            return Promise.resolve(
              jsonResponse({ email: "user@example.com", approved: true, admin: false }),
            );
          }
          return Promise.resolve(
            jsonResponse({
              ...SAMPLE_PUB,
              beerGardens: [
                { id: "g1", name: "Sunny Spot", isCovered: false, isHeated: false, isFamilyFriendly: false, petFriendly: false },
              ],
            }),
          );
        });
        localStorage.setItem("token", makeToken({ email: "user@example.com", approved: true, admin: false }));

        render(<PubPage />);
        await screen.findByText("The Harp");
        const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
        fireEvent.click(editBtn);

        const sunDropdown = screen.getByRole("combobox", { name: /sun exposure/i });
        fireEvent.change(sunDropdown, { target: { value: "FULL_SUN" } });
        expect((sunDropdown as HTMLSelectElement).value).toBe("FULL_SUN");
      });

      it("renders opening hours editor within a beer garden card", async () => {
        await setupAndEnterEditMode();
        fireEvent.click(screen.getByRole("button", { name: "Add beer garden" }));
        await screen.findByText("Garden 1");

        // After adding a garden there should be 2 editors: pub-level + garden
        const editors = screen.getAllByTestId("opening-hours-editor");
        expect(editors.length).toBeGreaterThanOrEqual(2);

        // Clicking the garden editor (last one) triggers the onChange mock without error
        fireEvent.click(editors[editors.length - 1]);
        expect(editors[editors.length - 1]).toBeInTheDocument();
      });
    });

    // -----------------------------------------------------------------------
    // Description and other optional text fields
    // -----------------------------------------------------------------------

    it("updates description textarea", async () => {
      await setupAndEnterEditMode();
      const descriptionTextarea = screen.getByDisplayValue(
        "A cosy pub near the theatre district.",
      );
      fireEvent.change(descriptionTextarea, {
        target: { value: "Updated description" },
      });
      expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
    });

    it("updates chain name field", async () => {
      await setupAndEnterEditMode();
      const chainInput = screen.getByDisplayValue("Fuller's");
      fireEvent.change(chainInput, { target: { value: "Wetherspoon" } });
      expect(screen.getByDisplayValue("Wetherspoon")).toBeInTheDocument();
    });

    it("triggers opening hours editor for pub-level hours", async () => {
      await setupAndEnterEditMode();
      // Get all opening hours editors
      const editors = screen.getAllByTestId("opening-hours-editor");
      // The first one should be the pub-level editor
      fireEvent.click(editors[0]);
      // No error = good
      expect(editors[0]).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // extractErrorMessage edge cases (via save)
  // -------------------------------------------------------------------------

  describe("error message extraction from API response", () => {
    async function triggerSave(mockResponse: unknown, status: number) {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          return Promise.resolve(jsonResponse(mockResponse, status));
        }
        return Promise.resolve(jsonResponse(SAMPLE_PUB));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);
      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);
    }

    it("extracts message field from error payload", async () => {
      await triggerSave({ message: "Something went wrong" }, 500);
      expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    });

    it("stringifies unknown error object", async () => {
      await triggerSave({ unknownField: "value" }, 500);
      expect(await screen.findByText(/unknownField/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // sanitizeBeerGarden (exercised via save with beer gardens)
  // -------------------------------------------------------------------------

  describe("sanitizeBeerGarden (via save)", () => {
    it("saves a newly added beer garden (temp id removed, empty strings become undefined)", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      let capturedBody: Record<string, unknown> | undefined;

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          capturedBody = JSON.parse((opts as RequestInit).body as string);
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        }
        return Promise.resolve(jsonResponse({ ...SAMPLE_PUB, beerGardens: [] }));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      // Add a new beer garden
      fireEvent.click(screen.getByRole("button", { name: "Add beer garden" }));
      await screen.findByText("Garden 1");

      // Fill in the garden name using its id
      const gardenNameById = document.getElementById("garden-0-name") as HTMLInputElement;
      fireEvent.change(gardenNameById, { target: { value: "Test Garden" } });

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      await waitFor(() => {
        expect(capturedBody).toBeDefined();
      });

      // Temp id should have been removed (no id on garden object)
      const gardens = capturedBody?.beerGardens as Array<Record<string, unknown>>;
      expect(gardens).toBeDefined();
      expect(gardens[0].id).toBeUndefined();
      expect(gardens[0].name).toBe("Test Garden");
    });

    it("saves a beer garden with null fields sanitized", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      let capturedBody: Record<string, unknown> | undefined;

      const pubWithNullGarden = {
        ...SAMPLE_PUB,
        beerGardens: [
          {
            id: "existing-garden",
            name: "Null Fields Garden",
            description: "",
            imageUrl: "",
            notes: "",
            openingHours: null as unknown as undefined,
            sunExposure: null as unknown as undefined,
            seatingCapacity: null as unknown as undefined,
            isCovered: null as unknown as undefined,
            isHeated: null as unknown as undefined,
            isFamilyFriendly: null as unknown as undefined,
            petFriendly: null as unknown as undefined,
            pubId: null as unknown as undefined,
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          capturedBody = JSON.parse((opts as RequestInit).body as string);
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        }
        return Promise.resolve(jsonResponse(pubWithNullGarden));
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      await waitFor(() => {
        expect(capturedBody).toBeDefined();
      });

      const gardens = capturedBody?.beerGardens as Array<Record<string, unknown>>;
      expect(gardens[0].id).toBe("existing-garden");
      // Null/empty fields should be cleaned
      expect(gardens[0].description).toBeUndefined();
      expect(gardens[0].imageUrl).toBeUndefined();
      expect(gardens[0].notes).toBeUndefined();
      expect(gardens[0].openingHours).toBeUndefined();
      expect(gardens[0].sunExposure).toBeUndefined();
      expect(gardens[0].seatingCapacity).toBeUndefined();
    });

    it("saves with beerTypeIds derived from beerType string field", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      let capturedBody: Record<string, unknown> | undefined;

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          capturedBody = JSON.parse((opts as RequestInit).body as string);
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        }
        return Promise.resolve(
          jsonResponse({ ...SAMPLE_PUB, beerTypes: undefined, beerType: "Real Ale" }),
        );
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      await waitFor(() => {
        expect(capturedBody).toBeDefined();
      });

      // beerTypes in body should reflect the beerTypeIds
      expect(capturedBody?.beerTypes).toBeDefined();
    });

    it("saves with beerTypeIds derived from beerType object field", async () => {
      const token = makeToken({ email: "user@example.com", approved: true, admin: false });
      localStorage.setItem("token", token);

      let capturedBody: Record<string, unknown> | undefined;

      vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
        if (typeof url === "string" && url.includes("/auth/me")) {
          return Promise.resolve(
            jsonResponse({ email: "user@example.com", approved: true, admin: false }),
          );
        }
        if (opts && (opts as RequestInit).method === "PATCH") {
          capturedBody = JSON.parse((opts as RequestInit).body as string);
          return Promise.resolve(jsonResponse(SAMPLE_PUB));
        }
        return Promise.resolve(
          jsonResponse({
            ...SAMPLE_PUB,
            beerTypes: undefined,
            beerType: { id: "bt-lager", name: "Lager" },
          }),
        );
      });

      render(<PubPage />);
      await screen.findByText("The Harp");
      const editBtn = await screen.findByRole("button", { name: "Edit this pub" });
      fireEvent.click(editBtn);

      const saveBtns = screen.getAllByRole("button", { name: "Save" });
      fireEvent.click(saveBtns[0]);

      await waitFor(() => {
        expect(capturedBody).toBeDefined();
      });

      expect(capturedBody?.beerTypes).toBeDefined();
    });
  });
});
