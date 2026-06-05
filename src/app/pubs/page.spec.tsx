import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Pubs from "./page";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => ({ get: () => null }),
}));

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const SAMPLE_PUBS = [
	{ id: "1", name: "The Harp", city: "London", address: "47 Chandos Place", country: "GB" },
	{ id: "2", name: "The Crown", city: "Manchester", address: "5 Crown Street", country: "GB" },
	{ id: "3", name: "Blue Anchor", city: "London", address: "13 Lower Mall", country: "GB" },
];

describe("Pubs page", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("shows loading state initially", () => {
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

		render(<Pubs />);

		expect(screen.getByText("Loading pubs…")).toBeInTheDocument();
	});

	it("renders a list of pubs after fetch succeeds", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ data: SAMPLE_PUBS }),
		);

		render(<Pubs />);

		expect(await screen.findByText("The Harp")).toBeInTheDocument();
		expect(screen.getByText("The Crown")).toBeInTheDocument();
		expect(screen.getByText("Blue Anchor")).toBeInTheDocument();
	});

	it("renders pub links pointing to the correct detail pages", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ data: SAMPLE_PUBS }),
		);

		render(<Pubs />);

		const harpLink = await screen.findByRole("link", { name: "The Harp" });
		expect(harpLink).toHaveAttribute("href", "/pubs/1");
	});

	it("shows empty state when no pubs are returned", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ data: [] }),
		);

		render(<Pubs />);

		expect(
			await screen.findByText("No pubs found."),
		).toBeInTheDocument();
	});

	it("shows error message when fetch fails with HTTP error", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Internal server error" }, 500),
		);

		render(<Pubs />);

		expect(await screen.findByText(/Error loading pubs/)).toBeInTheDocument();
	});

	it("shows error message when fetch throws a network error", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(
			new Error("Network failure"),
		);

		render(<Pubs />);

		expect(
			await screen.findByText(/Error loading pubs: Network failure/),
		).toBeInTheDocument();
	});

	it("renders Try again button on error", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

		render(<Pubs />);

		expect(
			await screen.findByRole("button", { name: "Try again" }),
		).toBeInTheDocument();
	});

	it("shows the Add pub link when pubs are loaded", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ data: SAMPLE_PUBS }),
		);

		render(<Pubs />);

		const addPubLink = await screen.findByRole("link", { name: /add pub/i });
		expect(addPubLink).toHaveAttribute("href", "/add-pub");
	});

	describe("search filtering", () => {
		it("filters pubs by name after debounce", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
				const search = new URL(url as string, "http://localhost").searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.name.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: filtered }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search by name, city/i,
			);
			fireEvent.change(searchInput, { target: { value: "harp" } });

			await waitFor(() => {
				expect(screen.getByText("The Harp")).toBeInTheDocument();
				expect(screen.queryByText("The Crown")).not.toBeInTheDocument();
				expect(screen.queryByText("Blue Anchor")).not.toBeInTheDocument();
			});
		});

		it("filters pubs by city", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
				const search = new URL(url as string, "http://localhost").searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.city.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: filtered }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search by name, city/i,
			);
			fireEvent.change(searchInput, { target: { value: "manchester" } });

			await waitFor(() => {
				expect(screen.getByText("The Crown")).toBeInTheDocument();
				expect(screen.queryByText("The Harp")).not.toBeInTheDocument();
				expect(screen.queryByText("Blue Anchor")).not.toBeInTheDocument();
			});
		});

		it("filters pubs by address", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
				const search = new URL(url as string, "http://localhost").searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.address.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: filtered }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search by name, city/i,
			);
			fireEvent.change(searchInput, { target: { value: "Lower Mall" } });

			await waitFor(() => {
				expect(screen.getByText("Blue Anchor")).toBeInTheDocument();
				expect(screen.queryByText("The Harp")).not.toBeInTheDocument();
				expect(screen.queryByText("The Crown")).not.toBeInTheDocument();
			});
		});


		it("does not show match count when search term is empty", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			expect(screen.queryByText(/Showing/i)).not.toBeInTheDocument();
		});
	});
});
