import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

import { useAuth } from "@/hooks/useAuth";
import PlaygroundPage from "./page";

function jsonResponse(data: unknown, status = 200, headers?: Record<string, string>): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});
}

function endpointRow(path: string): HTMLElement {
	const row = screen.getByText(path).closest("div");
	if (!row) throw new Error(`Could not find row for ${path}`);
	return row as HTMLElement;
}

const AUTHENTICATED_USER = { email: "alice@example.com", approved: true };

const SAMPLE_KEY = {
	id: "key_1",
	name: "My Key",
	tier: "DEVELOPER",
	keyPrefix: "pk_abc",
	isActive: true,
};

describe("PlaygroundPage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn().mockResolvedValue(undefined) },
			writable: true,
			configurable: true,
		});
	});

	it("shows an auth gate when the user is not authenticated", () => {
		render(<PlaygroundPage />);
		expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
	});

	it("shows a loading message while API keys are being fetched", () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

		render(<PlaygroundPage />);

		expect(screen.getByText("Loading your API keys…")).toBeInTheDocument();
	});

	it("shows an error message when the API keys request fails", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));

		render(<PlaygroundPage />);

		expect(await screen.findByText("Couldn't load your API keys.")).toBeInTheDocument();
	});

	it("shows an empty-state message with a dashboard link when there are no API keys", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ apiKeys: [] }));

		render(<PlaygroundPage />);

		expect(await screen.findByText(/You don.t have an API key yet\./)).toBeInTheDocument();
		for (const link of screen.getAllByRole("link", { name: "dashboard" })) {
			expect(link).toHaveAttribute("href", "/profile");
		}
	});

	it("renders the key picker pre-selected to the active key once keys load", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ apiKeys: [SAMPLE_KEY] }));

		render(<PlaygroundPage />);

		const picker = await screen.findByLabelText("Using key");
		expect(picker).toHaveValue("key_1");
	});

	it("sends a request immediately for a parameterless endpoint and renders the result", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse({ apiKeys: [SAMPLE_KEY] }))
			.mockResolvedValueOnce(
				jsonResponse({ beerTypes: ["IPA"] }, 200, {
					"x-ratelimit-remaining": "99",
					"x-ratelimit-limit": "100",
				})
			);

		render(<PlaygroundPage />);
		await screen.findByLabelText("Using key");

		await act(async () => {
			fireEvent.click(within(endpointRow("/api/v1/beer-types")).getByRole("button"));
		});

		await waitFor(() => {
			expect(screen.getByText("GET /api/v1/beer-types")).toBeInTheDocument();
		});
		expect(screen.getByText("200")).toBeInTheDocument();
		expect(screen.getByText("99/100 left")).toBeInTheDocument();

		const proxyCall = fetchMock.mock.calls.find(([input]) =>
			String(input).startsWith("/api/playground/beer-types")
		);
		expect(proxyCall?.[0]).toBe("/api/playground/beer-types?id=key_1");
	});

	it("expands a param form for an endpoint with parameters and disables sending until required fields are filled", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ apiKeys: [SAMPLE_KEY] }));

		render(<PlaygroundPage />);
		await screen.findByLabelText("Using key");

		fireEvent.click(within(endpointRow("/api/v1/pubs/:id")).getByRole("button"));

		const sendButton = screen.getByRole("button", { name: "Send request →" });
		expect(sendButton).toBeDisabled();

		fireEvent.change(screen.getByLabelText("id *"), { target: { value: "pub_123" } });
		expect(sendButton).toBeEnabled();
	});

	it("collapses the param form when Configure is clicked again", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ apiKeys: [SAMPLE_KEY] }));

		render(<PlaygroundPage />);
		await screen.findByLabelText("Using key");

		const toggleButton = within(endpointRow("/api/v1/pubs/:id")).getByRole("button");
		fireEvent.click(toggleButton);
		expect(screen.getByRole("button", { name: "Send request →" })).toBeInTheDocument();

		fireEvent.click(toggleButton);
		expect(screen.queryByRole("button", { name: "Send request →" })).not.toBeInTheDocument();
	});

	it("shows a network error message when the request throws", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse({ apiKeys: [SAMPLE_KEY] }))
			.mockRejectedValueOnce(new Error("network down"));

		render(<PlaygroundPage />);
		await screen.findByLabelText("Using key");

		await act(async () => {
			fireEvent.click(within(endpointRow("/api/v1/beer-types")).getByRole("button"));
		});

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Network error — couldn't reach the API."
		);
	});

	it("records requests in history and lets you revisit a previous result", async () => {
		vi.mocked(useAuth).mockReturnValue({ user: AUTHENTICATED_USER, isApproved: true, isAdmin: false });
		vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse({ apiKeys: [SAMPLE_KEY] }))
			.mockResolvedValueOnce(jsonResponse({ beerTypes: ["IPA"] }))
			.mockResolvedValueOnce(jsonResponse({ leaderboard: [] }));

		render(<PlaygroundPage />);
		await screen.findByLabelText("Using key");

		await act(async () => {
			fireEvent.click(within(endpointRow("/api/v1/beer-types")).getByRole("button"));
		});
		await screen.findByText("GET /api/v1/beer-types");

		await act(async () => {
			fireEvent.click(within(endpointRow("/api/v1/contributors/leaderboard")).getByRole("button"));
		});
		await screen.findByText("GET /api/v1/contributors/leaderboard");

		const historyToggle = screen.getByRole("button", { name: /history \(2\)/i });
		fireEvent.click(historyToggle);

		const beerTypesHistoryRow = screen.getByText("GET /api/v1/beer-types").closest("button");
		expect(beerTypesHistoryRow).toBeTruthy();
		if (beerTypesHistoryRow) fireEvent.click(beerTypesHistoryRow);

		expect(screen.getAllByText("GET /api/v1/beer-types").length).toBeGreaterThan(0);
	});
});
