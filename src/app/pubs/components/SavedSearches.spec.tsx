import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SavedSearches from "./SavedSearches";

vi.mock("next/link", () => ({
	default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const KENSINGTON = {
	id: "s1",
	name: "Kensington",
	params: { search: "Kensington", amenities: { hasBeerGarden: true } },
	createdAt: "2026-10-01T00:00:00.000Z",
	updatedAt: "2026-10-01T00:00:00.000Z",
};

type Handler = (url: string, init?: RequestInit) => Response;

function mockApi(handler: Handler) {
	return vi
		.spyOn(globalThis, "fetch")
		.mockImplementation(async (input, init) => handler(String(input), init));
}

describe("SavedSearches", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("links logged-out users to log in when filters are set", () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		render(<SavedSearches isLoggedIn={false} currentParams={{ search: "CR0" }} onRun={vi.fn()} />);

		expect(screen.getByRole("link", { name: "Log in to save this search" })).toHaveAttribute(
			"href",
			"/register",
		);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("renders nothing for logged-out users without filters", () => {
		const { container } = render(
			<SavedSearches isLoggedIn={false} currentParams={null} onRun={vi.fn()} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("disables saving when no filters are set", async () => {
		mockApi(() => jsonResponse({ savedSearches: [] }));
		render(<SavedSearches isLoggedIn currentParams={null} onRun={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Save this search" })).toBeDisabled();
	});

	it("saves the current search under the suggested name", async () => {
		const fetchSpy = mockApi((_url, init) =>
			init?.method === "POST"
				? jsonResponse({ savedSearch: { ...KENSINGTON, id: "s2", name: "CR0", params: { search: "CR0" } } }, 201)
				: jsonResponse({ savedSearches: [] }),
		);
		render(<SavedSearches isLoggedIn currentParams={{ search: "CR0" }} onRun={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Save this search" }));
		expect(screen.getByLabelText("Name this search")).toHaveValue("CR0");
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByRole("button", { name: "Search saved" })).toBeDisabled();
		const post = fetchSpy.mock.calls.find(([, init]) => init?.method === "POST");
		expect(post?.[0]).toBe("/api/auth/me/saved-searches");
		expect(JSON.parse(String(post?.[1]?.body))).toEqual({
			name: "CR0",
			params: { search: "CR0" },
		});
		expect(screen.getByRole("button", { name: "Saved searches (1)" })).toBeInTheDocument();
	});

	it("shows the API's error when saving fails", async () => {
		mockApi((_url, init) =>
			init?.method === "POST"
				? jsonResponse({ error: "You can save up to 25 searches" }, 409)
				: jsonResponse({ savedSearches: [] }),
		);
		render(<SavedSearches isLoggedIn currentParams={{ search: "CR0" }} onRun={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Save this search" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("You can save up to 25 searches");
		expect(screen.getByLabelText("Name this search")).toBeInTheDocument();
	});

	it("lists saved searches and runs one when clicked", async () => {
		mockApi(() => jsonResponse({ savedSearches: [KENSINGTON] }));
		const onRun = vi.fn();
		render(<SavedSearches isLoggedIn currentParams={null} onRun={onRun} />);

		fireEvent.click(await screen.findByRole("button", { name: "Saved searches (1)" }));
		const link = screen.getByRole("link", { name: "Kensington" });
		expect(link).toHaveAttribute("href", "/pubs?q=Kensington&amenities=hasBeerGarden");

		fireEvent.click(link);
		expect(onRun).toHaveBeenCalledWith(KENSINGTON.params);
		expect(screen.queryByRole("link", { name: "Kensington" })).not.toBeInTheDocument();
	});

	it("renames a saved search", async () => {
		const fetchSpy = mockApi((_url, init) =>
			init?.method === "PATCH"
				? jsonResponse({ savedSearch: { ...KENSINGTON, name: "Ken + garden" } })
				: jsonResponse({ savedSearches: [KENSINGTON] }),
		);
		render(<SavedSearches isLoggedIn currentParams={null} onRun={vi.fn()} />);

		fireEvent.click(await screen.findByRole("button", { name: "Saved searches (1)" }));
		fireEvent.click(screen.getByRole("button", { name: "Rename Kensington" }));
		fireEvent.change(screen.getByLabelText("New name for Kensington"), {
			target: { value: "Ken + garden" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByRole("link", { name: "Ken + garden" })).toBeInTheDocument();
		const patch = fetchSpy.mock.calls.find(([, init]) => init?.method === "PATCH");
		expect(patch?.[0]).toBe("/api/auth/me/saved-searches/s1");
		expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ name: "Ken + garden" });
	});

	it("deletes a saved search", async () => {
		mockApi((_url, init) =>
			init?.method === "DELETE"
				? jsonResponse({ success: true })
				: jsonResponse({ savedSearches: [KENSINGTON] }),
		);
		render(<SavedSearches isLoggedIn currentParams={null} onRun={vi.fn()} />);

		fireEvent.click(await screen.findByRole("button", { name: "Saved searches (1)" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete Kensington" }));

		await waitFor(() =>
			expect(screen.queryByRole("link", { name: "Kensington" })).not.toBeInTheDocument(),
		);
		expect(screen.getByText(/No saved searches yet/)).toBeInTheDocument();
	});

	it("marks the current search as already saved", async () => {
		mockApi(() => jsonResponse({ savedSearches: [KENSINGTON] }));
		render(
			<SavedSearches
				isLoggedIn
				currentParams={{ search: "Kensington", amenities: { hasBeerGarden: true } }}
				onRun={vi.fn()}
			/>,
		);

		expect(await screen.findByRole("button", { name: "Search saved" })).toBeDisabled();
	});

	it("shows an error when the list fails to load", async () => {
		mockApi(() => jsonResponse({ error: "Not authenticated" }, 401));
		render(<SavedSearches isLoggedIn currentParams={null} onRun={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Saved searches" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("Not authenticated");
	});
});
