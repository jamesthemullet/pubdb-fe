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
			await screen.findByText("No pubs found in the database."),
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

	it("renders Try Again button on error", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

		render(<Pubs />);

		expect(
			await screen.findByRole("button", { name: "Try Again" }),
		).toBeInTheDocument();
	});

	it("shows the Add Pub link when pubs are loaded", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ data: SAMPLE_PUBS }),
		);

		render(<Pubs />);

		const addPubLink = await screen.findByRole("link", { name: "Add Pub" });
		expect(addPubLink).toHaveAttribute("href", "/add-pub");
	});

	describe("search filtering", () => {
		it("filters pubs by name after debounce", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
				const search = new URL(url as string).searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.name.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: filtered }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search pubs by name, city/i,
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
				const search = new URL(url as string).searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.city.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: filtered }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search pubs by name, city/i,
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
				const search = new URL(url as string).searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.address.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: filtered }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search pubs by name, city/i,
			);
			fireEvent.change(searchInput, { target: { value: "Lower Mall" } });

			await waitFor(() => {
				expect(screen.getByText("Blue Anchor")).toBeInTheDocument();
				expect(screen.queryByText("The Harp")).not.toBeInTheDocument();
				expect(screen.queryByText("The Crown")).not.toBeInTheDocument();
			});
		});

		it("shows match count when search term is active", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
				const search = new URL(url as string).searchParams.get("search") ?? "";
				const filtered = SAMPLE_PUBS.filter((p) =>
					p.city.toLowerCase().includes(search.toLowerCase()),
				);
				return Promise.resolve(jsonResponse({ data: search ? filtered : SAMPLE_PUBS }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			const searchInput = screen.getByPlaceholderText(
				/search pubs by name, city/i,
			);
			fireEvent.change(searchInput, { target: { value: "london" } });

			await waitFor(() => {
				expect(screen.getByText(/Showing 2 pubs/i)).toBeInTheDocument();
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

	describe("filters panel", () => {
		it("shows a Filters button", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			expect(screen.getByRole("button", { name: /filters/i })).toBeInTheDocument();
		});

		it("toggles the filter panel open and closed", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			const filtersBtn = screen.getByRole("button", { name: /filters/i });
			expect(screen.queryByText("Dog friendly")).not.toBeInTheDocument();

			fireEvent.click(filtersBtn);
			expect(screen.getByText("Dog friendly")).toBeInTheDocument();

			fireEvent.click(filtersBtn);
			expect(screen.queryByText("Dog friendly")).not.toBeInTheDocument();
		});

		it("sends amenity filter params to the API when a checkbox is ticked", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			fireEvent.click(screen.getByRole("button", { name: /filters/i }));
			fireEvent.click(screen.getByRole("checkbox", { name: "Dog friendly" }));

			await waitFor(() => {
				const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0] as string;
				expect(new URL(lastCall).searchParams.get("isDogFriendly")).toBe("true");
			});
		});

		it("shows a badge on the Filters button when filters are active", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			fireEvent.click(screen.getByRole("button", { name: /filters/i }));
			fireEvent.click(screen.getByRole("checkbox", { name: "Beer garden" }));
			fireEvent.click(screen.getByRole("checkbox", { name: "Food served" }));

			await waitFor(() => {
				expect(screen.getByLabelText("2 active")).toBeInTheDocument();
			});
		});

		it("clears all filters when Clear all is clicked", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			fireEvent.click(screen.getByRole("button", { name: /filters/i }));
			fireEvent.click(screen.getByRole("checkbox", { name: "Dog friendly" }));

			await waitFor(() => {
				expect(screen.getByLabelText("1 active")).toBeInTheDocument();
			});

			fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

			await waitFor(() => {
				expect(screen.queryByLabelText(/active/i)).not.toBeInTheDocument();
				const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0] as string;
				expect(new URL(lastCall).searchParams.get("isDogFriendly")).toBeNull();
			});
		});

		it("shows filter-specific empty state when active filter returns no pubs", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
				const params = new URL(url as string).searchParams;
				// Return empty when any amenity filter is set
				if (params.get("hasCaskAle") === "true") {
					return Promise.resolve(jsonResponse({ data: [] }));
				}
				return Promise.resolve(jsonResponse({ data: SAMPLE_PUBS }));
			});

			render(<Pubs />);

			await screen.findByText("The Harp");

			fireEvent.click(screen.getByRole("button", { name: /filters/i }));
			fireEvent.click(screen.getByRole("checkbox", { name: "Cask ale" }));

			await waitFor(() => {
				expect(
					screen.getByText("No pubs found matching your filters."),
				).toBeInTheDocument();
			});
		});
	});

	describe("sort order", () => {
		it("sorts pubs name A–Z when selected", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			fireEvent.click(screen.getByRole("button", { name: /filters/i }));

			fireEvent.change(screen.getByRole("combobox", { name: /sort/i }), {
				target: { value: "name_asc" },
			});

			const items = screen.getAllByRole("listitem");
			expect(items[0]).toHaveTextContent("Blue Anchor");
			expect(items[1]).toHaveTextContent("The Crown");
			expect(items[2]).toHaveTextContent("The Harp");
		});

		it("sorts pubs name Z–A when selected", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ data: SAMPLE_PUBS }),
			);

			render(<Pubs />);

			await screen.findByText("The Harp");

			fireEvent.click(screen.getByRole("button", { name: /filters/i }));

			fireEvent.change(screen.getByRole("combobox", { name: /sort/i }), {
				target: { value: "name_desc" },
			});

			const items = screen.getAllByRole("listitem");
			expect(items[0]).toHaveTextContent("The Harp");
			expect(items[1]).toHaveTextContent("The Crown");
			expect(items[2]).toHaveTextContent("Blue Anchor");
		});
	});
});
