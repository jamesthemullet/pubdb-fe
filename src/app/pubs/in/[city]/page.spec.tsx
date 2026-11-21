import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/serverApiUrl", () => ({
  getServerApiUrl: () => "http://test-api",
  getTestingApiKeyHeader: () => ({}),
}));

import CityPubsPage, { generateMetadata } from "./page";

function mockFetchResponses({
  cities,
  pubs,
  total,
  citiesOk = true,
  pubsOk = true,
}: {
  cities?: string[];
  pubs?: unknown[];
  total?: number;
  citiesOk?: boolean;
  pubsOk?: boolean;
}) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url.includes("/filters")) {
      return {
        ok: citiesOk,
        json: () => Promise.resolve({ data: { cities: cities ?? [] } }),
      } as unknown as Response;
    }
    if (url.includes("/pubs?")) {
      return {
        ok: pubsOk,
        json: () =>
          Promise.resolve({
            data: pubs ?? [],
            pagination: { total: total ?? (pubs ?? []).length },
          }),
      } as unknown as Response;
    }
    throw new Error(`unexpected fetch url: ${url}`);
  }) as unknown as typeof fetch;
}

const leedsParams = Promise.resolve({ city: "leeds" });

describe("CityPubsPage", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("renders the heading, pub count and pub links for a known city slug", async () => {
    mockFetchResponses({
      cities: ["Leeds"],
      pubs: [
        { id: "pub-1", name: "The Angel", city: "Leeds", area: "City Centre" },
        { id: "pub-2", name: "The Oak", city: "Leeds" },
      ],
      total: 2,
    });

    render(await CityPubsPage({ params: leedsParams }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pubs in Leeds");
    expect(screen.getByText(/2 pubs in Leeds/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /the angel/i })).toHaveAttribute(
      "href",
      "/pubs/pub-1"
    );
    expect(screen.getByRole("link", { name: /the oak/i })).toHaveAttribute(
      "href",
      "/pubs/pub-2"
    );
  });

  it("uses the singular 'pub' for a count of one", async () => {
    mockFetchResponses({
      cities: ["Leeds"],
      pubs: [{ id: "pub-1", name: "The Angel", city: "Leeds" }],
      total: 1,
    });

    render(await CityPubsPage({ params: leedsParams }));

    expect(screen.getByText(/1 pub in Leeds/)).toBeInTheDocument();
  });

  it("calls notFound() for a slug that matches no known city", async () => {
    mockFetchResponses({ cities: ["Leeds"], pubs: [], total: 0 });

    await expect(
      CityPubsPage({ params: Promise.resolve({ city: "nowhere" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound() when the resolved city has zero pubs", async () => {
    mockFetchResponses({ cities: ["Leeds"], pubs: [], total: 0 });

    await expect(CityPubsPage({ params: leedsParams })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound() when the cities fetch fails", async () => {
    mockFetchResponses({ citiesOk: false });

    await expect(CityPubsPage({ params: leedsParams })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound() when the pubs fetch throws", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("/filters")) {
        return {
          ok: true,
          json: () => Promise.resolve({ data: { cities: ["Leeds"] } }),
        } as unknown as Response;
      }
      throw new Error("network error");
    }) as unknown as typeof fetch;

    await expect(CityPubsPage({ params: leedsParams })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

describe("CityPubsPage generateMetadata", () => {
  it("builds the title and description from the resolved city and pub count", async () => {
    mockFetchResponses({
      cities: ["Leeds"],
      pubs: [{ id: "pub-1", name: "The Angel", city: "Leeds" }],
      total: 7,
    });

    const metadata = await generateMetadata({ params: leedsParams });

    expect(metadata.title).toBe("Pubs in Leeds");
    expect(metadata.description).toContain("7 pubs in Leeds");
  });

  it("falls back to 'City not found' when the city can't be resolved", async () => {
    mockFetchResponses({ citiesOk: false });

    const metadata = await generateMetadata({
      params: Promise.resolve({ city: "nowhere" }),
    });

    expect(metadata.title).toBe("City not found");
  });
});
