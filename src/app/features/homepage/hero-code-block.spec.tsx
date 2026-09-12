import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import HeroCodeBlock from "./hero-code-block";

function mockFetchWith(payload: unknown, ok = true) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(payload), { status: ok ? 200 : 500 }),
  );
}

describe("HeroCodeBlock", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the provided JSON immediately and does not fetch when initialJson is a string", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const jsonStr = '{"name":"The Crown","city":"London"}';

    render(<HeroCodeBlock initialJson={jsonStr} />);

    expect(screen.getByText(jsonStr)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders all four language tabs with curl selected by default", async () => {
    mockFetchWith({ data: [{ id: 1 }] });
    render(<HeroCodeBlock />);

    // Wait for the async fetch to settle so no act() warnings leak
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    ).catch(() => undefined);

    const tabs = ["curl", "node", "python", "ruby"];
    for (const lang of tabs) {
      expect(screen.getByRole("tab", { name: lang })).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "node" })).toHaveAttribute("aria-selected", "false");
  });

  it("clicking a tab makes it active and shows its code", async () => {
    mockFetchWith({ data: [] });
    render(<HeroCodeBlock />);

    fireEvent.click(screen.getByRole("tab", { name: "python" }));

    expect(screen.getByRole("tab", { name: "python" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("import requests");

    // Let the background fetch settle
    await waitFor(() => {}).catch(() => undefined);
  });

  it("ArrowRight moves focus through tabs and wraps from last back to first", () => {
    render(<HeroCodeBlock initialJson="{}" />);
    const tablist = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");

    // Initial selection is the first tab (curl)
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    // Cycle forward through all four tabs
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");

    // One more ArrowRight wraps back to the first tab
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowLeft wraps from first to last tab; Home and End jump to boundary tabs", () => {
    render(<HeroCodeBlock initialJson="{}" />);
    const tablist = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");

    // End → last tab
    fireEvent.keyDown(tablist, { key: "End" });
    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");

    // Home → first tab
    fireEvent.keyDown(tablist, { key: "Home" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    // ArrowLeft from first wraps to last
    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("fetches a sample pub and displays the JSON when initialJson is not provided", async () => {
    const samplePub = { id: "pub_001", name: "The Anchor" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [samplePub] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await act(async () => {
      render(<HeroCodeBlock />);
    });

    await waitFor(() =>
      expect(screen.getByText(/"name": "The Anchor"/)).toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledWith("/api/pubs?limit=1", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("shows the fallback message when the client-side fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<HeroCodeBlock />);

    await waitFor(() => {
      expect(screen.getByText(/response will appear here/)).toBeInTheDocument();
    });
  });

  it("shows the fallback message when the API returns a non-ok status", async () => {
    mockFetchWith({}, false);

    render(<HeroCodeBlock />);

    await waitFor(() => {
      expect(screen.getByText(/response will appear here/)).toBeInTheDocument();
    });
  });
});
