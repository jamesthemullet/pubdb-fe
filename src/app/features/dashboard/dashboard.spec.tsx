import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useContributions", () => ({
	useContributions: () => ({
		contributions: { totalAdded: 0, recentPubs: [], editsByPub: [] },
		contributionsLoading: false,
		contributionsError: null,
	}),
}));

import Dashboard from "./dashboard";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const SAMPLE_API_KEY = {
	name: "My Key",
	tier: "PRO",
	keyPrefix: "pk_abc",
	isActive: true,
	keyStatus: "ACTIVE",
	status: "active",
	createdAt: "2024-01-01T00:00:00.000Z",
	lastUsed: "2024-04-01T12:00:00.000Z",
	usageCount: 42,
	remaining: { hour: 80, day: 800, month: 8000 },
	limits: {
		requestsPerHour: 100,
		requestsPerDay: 1000,
		requestsPerMonth: 10000,
	},
	resetTimes: {
		hour: "2024-04-01T13:00:00.000Z",
		day: "2024-04-02T00:00:00.000Z",
		month: "2024-05-01T00:00:00.000Z",
	},
	features: { allowLocationSearch: true, allowStats: false },
};

const SAMPLE_DASHBOARD_DATA = {
	user: {
		name: "Alice Smith",
		username: "alice",
		email: "alice@example.com",
		approved: true,
		emailVerified: true,
	},
	apiKeys: [SAMPLE_API_KEY],
	summary: { totalApiKeys: 1, totalUsage: 42 },
};

describe("Dashboard", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
		localStorage.clear();
	});

	afterEach(() => {
		process.env = originalEnv;
		localStorage.clear();
	});

	describe("authentication", () => {
		it("renders nothing when not authenticated", () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			const { container } = render(<Dashboard />);

			expect(container).toBeEmptyDOMElement();
		});

		it("fetches dashboard data when token is present", async () => {
			localStorage.setItem("token", "test-token");
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("Welcome, Alice Smith")).toBeInTheDocument();
			});
		});

		it("reacts to authChanged event by showing dashboard when token is added", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			const { container } = render(<Dashboard />);
			expect(container).toBeEmptyDOMElement();

			localStorage.setItem("token", "test-token");
			act(() => {
				window.dispatchEvent(new Event("authChanged"));
			});

			await waitFor(() => {
				expect(screen.getByText("Welcome, Alice Smith")).toBeInTheDocument();
			});
		});
	});

	describe("dashboard data display", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		it("shows user email", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText("Email: alice@example.com"),
				).toBeInTheDocument();
			});
		});

		it("falls back to username when name is empty", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				user: { ...SAMPLE_DASHBOARD_DATA.user, name: "" },
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("Welcome, alice")).toBeInTheDocument();
			});
		});

		it("shows pending approval warning when not approved", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				user: { ...SAMPLE_DASHBOARD_DATA.user, approved: false },
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Account pending approval/),
				).toBeInTheDocument();
			});
		});

		it("shows email not verified warning when email unverified", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				user: { ...SAMPLE_DASHBOARD_DATA.user, emailVerified: false },
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/Email not verified/)).toBeInTheDocument();
			});
		});

		it("shows 'No API keys' message when apiKeys is empty", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [],
				summary: { totalApiKeys: 0, totalUsage: 0 },
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(
						"No API keys found. You may need to create an API key to get started.",
					),
				).toBeInTheDocument();
			});
		});

		it("renders API key card with name, tier, and key prefix", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
				expect(
					screen.getByText(/Tier: PRO \| Key: pk_abc\*\*\*/),
				).toBeInTheDocument();
			});
		});

		it("renders usage stats (hourly, daily, monthly)", async () => {
			// Make each period have distinct usage percentages
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [
					{
						...SAMPLE_API_KEY,
						remaining: { hour: 80, day: 700, month: 5000 },
						limits: {
							requestsPerHour: 100,
							requestsPerDay: 1000,
							requestsPerMonth: 10000,
						},
					},
				],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("Hourly")).toBeInTheDocument();
				expect(screen.getByText("Daily")).toBeInTheDocument();
				expect(screen.getByText("Monthly")).toBeInTheDocument();
				// 100-80 = 20 used → 20.0%
				expect(screen.getByText("20.0% used")).toBeInTheDocument();
				// 1000-700 = 300 used → 30.0%
				expect(screen.getByText("30.0% used")).toBeInTheDocument();
				// 10000-5000 = 5000 used → 50.0%
				expect(screen.getByText("50.0% used")).toBeInTheDocument();
			});
		});

		it("shows last used date when present", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/Last used:/)).toBeInTheDocument();
			});
		});

		it("does not show last used when lastUsed is null", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, lastUsed: null }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.queryByText(/Last used:/)).not.toBeInTheDocument();
			});
		});

		it("shows summary with total keys and usage", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Summary: 1 API key\(s\) with 42 total requests/),
				).toBeInTheDocument();
			});
		});

		it("shows Location Search in features when allowLocationSearch is true", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/Location Search/)).toBeInTheDocument();
			});
		});

		it("shows 'Basic API access only' when no features enabled", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [
					{
						...SAMPLE_API_KEY,
						features: { allowLocationSearch: false, allowStats: false },
					},
				],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/Basic API access only/)).toBeInTheDocument();
			});
		});

		it("shows Statistics feature when allowStats is true", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [
					{
						...SAMPLE_API_KEY,
						features: { allowLocationSearch: false, allowStats: true },
					},
				],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/Statistics/)).toBeInTheDocument();
			});
		});
	});

	describe("error handling", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		it("shows error message when fetch fails with network error", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(
				new Error("Network failure"),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Error loading dashboard: Network failure/),
				).toBeInTheDocument();
			});
		});

		it("shows error message from API error response", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ message: "Unauthorized access" }, 401),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Error loading dashboard: Unauthorized access/),
				).toBeInTheDocument();
			});
		});

		it("shows error.error field when message is absent", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ error: "Token expired" }, 403),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Error loading dashboard: Token expired/),
				).toBeInTheDocument();
			});
		});

		it("shows Try Again button in error state", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Try Again" }),
				).toBeInTheDocument();
			});
		});
	});

	describe("cancel subscription", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		it("shows cancel subscription button for non-HOBBY ACTIVE keys", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Cancel subscription" }),
				).toBeInTheDocument();
			});
		});

		it("does not show cancel button for HOBBY tier", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, tier: "HOBBY" }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
			expect(
				screen.queryByRole("button", { name: "Cancel subscription" }),
			).not.toBeInTheDocument();
		});

		it("does not show cancel button for INACTIVE keys", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, keyStatus: "INACTIVE" }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
			expect(
				screen.queryByRole("button", { name: "Cancel subscription" }),
			).not.toBeInTheDocument();
		});

		it("shows success message after cancellation", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({ message: "Subscription cancelled successfully." }),
				);
			vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<Dashboard />);

			const cancelBtn = await screen.findByRole("button", {
				name: "Cancel subscription",
			});
			fireEvent.click(cancelBtn);

			await waitFor(() => {
				expect(
					screen.getByText("Subscription cancelled successfully."),
				).toBeInTheDocument();
			});
		});

		it("shows error message when cancellation fails", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({ message: "Failed to cancel" }, 500),
				);
			vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<Dashboard />);

			const cancelBtn = await screen.findByRole("button", {
				name: "Cancel subscription",
			});
			fireEvent.click(cancelBtn);

			await waitFor(() => {
				expect(
					screen.getByText("Error cancelling subscription: Failed to cancel"),
				).toBeInTheDocument();
			});
		});

		it("does not cancel when user dismisses the confirm dialog", async () => {
			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValue(jsonResponse(SAMPLE_DASHBOARD_DATA));
			vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<Dashboard />);

			const cancelBtn = await screen.findByRole("button", {
				name: "Cancel subscription",
			});
			fireEvent.click(cancelBtn);

			// Only the initial dashboard fetch should occur
			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("forgot API key", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		it("shows forgot API key button for non-HOBBY ACTIVE keys", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Forgot API key" }),
				).toBeInTheDocument();
			});
		});

		it("shows success message after forgot API key (no new key in response)", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({
						message: "API key reminder sent to your email.",
					}),
				);

			render(<Dashboard />);

			const forgotBtn = await screen.findByRole("button", {
				name: "Forgot API key",
			});
			fireEvent.click(forgotBtn);

			await waitFor(() => {
				expect(
					screen.getByText("API key reminder sent to your email."),
				).toBeInTheDocument();
			});
		});

		it("shows error when forgot API key request fails", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({ message: "Key not found" }, 404),
				);

			render(<Dashboard />);

			const forgotBtn = await screen.findByRole("button", {
				name: "Forgot API key",
			});
			fireEvent.click(forgotBtn);

			await waitFor(() => {
				expect(screen.getByText("Key not found")).toBeInTheDocument();
			});
		});

		it("opens modal with new key when API returns apiKey in response", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({
						message: "New key generated.",
						apiKey: {
							name: "My Key",
							tier: "PRO",
							keyStatus: "ACTIVE",
							keyPrefix: "pk_abc",
							key: "pk_abc_supersecretkey",
							permissions: ["read"],
						},
					}),
				);

			render(<Dashboard />);

			const forgotBtn = await screen.findByRole("button", {
				name: "Forgot API key",
			});
			fireEvent.click(forgotBtn);

			await waitFor(() => {
				expect(
					screen.getByText("New API key generated"),
				).toBeInTheDocument();
				expect(screen.getByText("pk_abc_supersecretkey")).toBeInTheDocument();
			});
		});

		it("closes modal when Close button is clicked", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({
						message: "New key generated.",
						apiKey: {
							name: "My Key",
							tier: "PRO",
							keyStatus: "ACTIVE",
							keyPrefix: "pk_abc",
							key: "pk_abc_supersecretkey",
							permissions: [],
						},
					}),
				);

			render(<Dashboard />);

			const forgotBtn = await screen.findByRole("button", {
				name: "Forgot API key",
			});
			fireEvent.click(forgotBtn);

			await waitFor(() => {
				expect(
					screen.getByText("New API key generated"),
				).toBeInTheDocument();
			});

			const closeBtn = screen.getByRole("button", { name: "Close" });
			fireEvent.click(closeBtn);

			await waitFor(() => {
				expect(
					screen.queryByText("New API key generated"),
				).not.toBeInTheDocument();
			});
		});

		it("copies API key to clipboard successfully", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({
						message: "New key generated.",
						apiKey: {
							name: "My Key",
							tier: "PRO",
							keyStatus: "ACTIVE",
							keyPrefix: "pk_abc",
							key: "pk_abc_supersecretkey",
							permissions: [],
						},
					}),
				);

			const clipboardWriteSpy = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, "clipboard", {
				value: { writeText: clipboardWriteSpy },
				writable: true,
				configurable: true,
			});

			render(<Dashboard />);

			const forgotBtn = await screen.findByRole("button", {
				name: "Forgot API key",
			});
			fireEvent.click(forgotBtn);

			const copyBtn = await screen.findByRole("button", {
				name: "Copy API key",
			});
			fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
			});

			expect(clipboardWriteSpy).toHaveBeenCalledWith("pk_abc_supersecretkey");
		});

		it("shows 'Copy failed' when clipboard is unavailable", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({
						message: "New key generated.",
						apiKey: {
							name: "My Key",
							tier: "PRO",
							keyStatus: "ACTIVE",
							keyPrefix: "pk_abc",
							key: "pk_abc_supersecretkey",
							permissions: [],
						},
					}),
				);

			Object.defineProperty(navigator, "clipboard", {
				value: undefined,
				writable: true,
				configurable: true,
			});

			render(<Dashboard />);

			const forgotBtn = await screen.findByRole("button", {
				name: "Forgot API key",
			});
			fireEvent.click(forgotBtn);

			const copyBtn = await screen.findByRole("button", {
				name: "Copy API key",
			});
			fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Copy failed" }),
				).toBeInTheDocument();
			});
		});
	});
});
