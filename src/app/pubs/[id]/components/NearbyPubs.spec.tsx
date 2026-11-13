import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Pub } from "@/types/pub";
import NearbyPubs from "./NearbyPubs";

const CURRENT_PUB: Pub = {
  id: "current",
  name: "The Test Arms",
  city: "London",
  address: "1 Test St",
  postcode: "E1 1AA",
  country: "GB",
  createdAt: "2024-01-01T00:00:00Z",
  lat: 51.5074,
  lng: -0.1278,
};

function makePub(overrides: Partial<Pub> & { id: string }): Pub {
  return {
    name: "Other Pub",
    city: "London",
    address: "2 Test St",
    postcode: "E1 1AB",
    country: "GB",
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NearbyPubs", () => {
  it("renders nothing when the current pub has no coordinates", () => {
    const pub = makePub({ id: "no-coords" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<NearbyPubs pub={pub} />);

    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches candidates near the current pub and renders them sorted by distance", async () => {
    const near = makePub({ id: "near", name: "The Near Arms", lat: 51.508, lng: -0.128 });
    const far = makePub({ id: "far", name: "The Far Arms", lat: 51.6, lng: -0.2 });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [far, near] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NearbyPubs pub={CURRENT_PUB} />);

    await waitFor(() => {
      expect(screen.getByText("Nearby pubs")).toBeInTheDocument();
    });

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining("The Near Arms"),
      expect.stringContaining("The Far Arms"),
    ]);
    expect(links[0]).toHaveAttribute("href", "/pubs/near");

    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain("/api/pubs?");
    expect(requestedUrl).toContain("lat=51.5074");
    expect(requestedUrl).toContain("lng=-0.1278");
  });

  it("renders nothing when there are no nearby candidates with coordinates", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [makePub({ id: "no-coords" })] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<NearbyPubs pub={CURRENT_PUB} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
