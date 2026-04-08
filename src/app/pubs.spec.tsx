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

  it("shows an error when the city is missing from the pub data", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    render(<Pubs />);

    await waitFor(() =>
      expect(screen.queryByText("Loading pubs…")).not.toBeInTheDocument()
    );
  });
});
