import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeroCodeBlock from "./hero-code-block";

describe("HeroCodeBlock", () => {
	beforeEach(() => {
		// Default stub — keeps tests that pass initialJson={null} from triggering real fetches
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
	it("renders all four language tabs", () => {
		render(<HeroCodeBlock initialJson={null} />);
		expect(screen.getByRole("tab", { name: "curl" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "node" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "python" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "ruby" })).toBeInTheDocument();
	});

	it("selects the curl tab by default", () => {
		render(<HeroCodeBlock initialJson={null} />);
		const curlTab = screen.getByRole("tab", { name: "curl" });
		expect(curlTab).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tab", { name: "node" })).toHaveAttribute("aria-selected", "false");
	});

	it("switches the active tab and code panel when another tab is clicked", () => {
		render(<HeroCodeBlock initialJson={null} />);
		fireEvent.click(screen.getByRole("tab", { name: "python" }));
		expect(screen.getByRole("tab", { name: "python" })).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "false");
		expect(screen.getByRole("tabpanel")).toHaveTextContent("requests.get");
	});

	it("moves focus to the next tab on ArrowRight and wraps around", () => {
		render(<HeroCodeBlock initialJson={null} />);
		const tablist = screen.getByRole("tablist");

		// Start on curl (index 0), ArrowRight should activate node (index 1)
		act(() => { fireEvent.keyDown(tablist, { key: "ArrowRight" }); });
		expect(screen.getByRole("tab", { name: "node" })).toHaveAttribute("aria-selected", "true");

		// Navigate to the end (ruby, index 3) then wrap back to curl
		act(() => { fireEvent.keyDown(tablist, { key: "End" }); });
		expect(screen.getByRole("tab", { name: "ruby" })).toHaveAttribute("aria-selected", "true");
		act(() => { fireEvent.keyDown(tablist, { key: "ArrowRight" }); });
		expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "true");
	});

	it("displays pre-fetched server JSON without showing the loading skeleton", () => {
		const sample = JSON.stringify({ id: "pub_001", name: "The Crown" }, null, 2);
		render(<HeroCodeBlock initialJson={sample} />);
		expect(screen.getByText(/"The Crown"/)).toBeInTheDocument();
	});

	it("shows the fallback message when the API returns a non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Internal Server Error", { status: 500 })
		);

		await act(async () => {
			render(<HeroCodeBlock />);
		});

		expect(screen.getByText("// response will appear here")).toBeInTheDocument();
	});

	it("shows the fallback message when fetch throws a network error", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

		await act(async () => {
			render(<HeroCodeBlock />);
		});

		expect(screen.getByText("// response will appear here")).toBeInTheDocument();
	});

	it("moves focus to the first tab on Home and the last on End", () => {
		render(<HeroCodeBlock initialJson={null} />);
		const tablist = screen.getByRole("tablist");

		act(() => { fireEvent.keyDown(tablist, { key: "End" }); });
		expect(screen.getByRole("tab", { name: "ruby" })).toHaveAttribute("aria-selected", "true");

		act(() => { fireEvent.keyDown(tablist, { key: "Home" }); });
		expect(screen.getByRole("tab", { name: "curl" })).toHaveAttribute("aria-selected", "true");
	});
});
