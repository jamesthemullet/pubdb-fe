import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Pubs from "./pubs";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Pubs (homepage component)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading message initially", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

    render(<Pubs />);

    expect(screen.getByText("Loading pubs…")).toBeInTheDocument();
  });

  it("renders a list of pubs after a successful fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([
        { id: "1", name: "The Harp", city: "London", address: "47 Chandos Place" },
        { id: "2", name: "The Crown", city: "Brighton", address: "1 High St" },
      ])
    );

    render(<Pubs />);

    expect(await screen.findByText("The Harp")).toBeInTheDocument();
    expect(screen.getByText("The Crown")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The Harp" })).toHaveAttribute(
      "href",
      "/pubs/1"
    );
  });

  it("hides the loading message after fetch completes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([{ id: "1", name: "The Harp", city: "London", address: "" }])
    );

    render(<Pubs />);

    await waitFor(() =>
      expect(screen.queryByText("Loading pubs…")).not.toBeInTheDocument()
    );
  });

  it("renders city alongside the pub name", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([
        { id: "1", name: "The Harp", city: "London", address: "47 Chandos Place" },
      ])
    );

    render(<Pubs />);

    await screen.findByText("The Harp");
    expect(screen.getByText(/London/)).toBeInTheDocument();
  });

  it("renders an empty list when the API returns no pubs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

    render(<Pubs />);

    await screen.findByRole("list");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders an empty list when fetch throws a network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    render(<Pubs />);

    await waitFor(() =>
      expect(screen.queryByText("Loading pubs…")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("fetches from /api/pubs", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([]));

    render(<Pubs />);

    await screen.findByRole("list");
    expect(fetchSpy).toHaveBeenCalledWith("/api/pubs");
  });
});
