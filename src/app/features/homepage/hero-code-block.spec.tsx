import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

	it("ArrowRight keyboard navigation advances the active tab", async () => {
		mockFetchWith({ data: [] });
		render(<HeroCodeBlock />);

		// curl is active (index 0); ArrowRight should move to node (index 1)
		fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

		expect(screen.getByRole("tab", { name: "node" })).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "false");

		await waitFor(() => {}).catch(() => undefined);
	});

	it("Home and End keyboard shortcuts jump to the first and last tab", async () => {
		mockFetchWith({ data: [] });
		render(<HeroCodeBlock />);

		const tablist = screen.getByRole("tablist");

		fireEvent.keyDown(tablist, { key: "End" });
		expect(screen.getByRole("tab", { name: "ruby" })).toHaveAttribute("aria-selected", "true");

		fireEvent.keyDown(tablist, { key: "Home" });
		expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "true");

		await waitFor(() => {}).catch(() => undefined);
	});

	it("displays initialJson immediately without a client-side fetch", () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		const sampleJson = JSON.stringify({ id: 1, name: "The Crown" }, null, 2);

		render(<HeroCodeBlock initialJson={sampleJson} />);

		expect(screen.getByText(/The Crown/)).toBeInTheDocument();
		expect(fetchSpy).not.toHaveBeenCalled();
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

	it("ArrowRight wraps from the last tab back to the first", async () => {
		mockFetchWith({ data: [] });
		render(<HeroCodeBlock />);

		const tablist = screen.getByRole("tablist");

		// Jump to the last tab (ruby) then wrap around with ArrowRight
		fireEvent.keyDown(tablist, { key: "End" });
		expect(screen.getByRole("tab", { name: "ruby" })).toHaveAttribute("aria-selected", "true");

		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "true");

		await waitFor(() => {}).catch(() => undefined);
	});
});
