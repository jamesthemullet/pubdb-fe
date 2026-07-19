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
	id: "key_1",
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
		it("shows a sign-in prompt when not authenticated", () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
		});

		it("fetches dashboard data when token is present", async () => {
			localStorage.setItem("token", "test-token");
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
		});

		it("reacts to authChanged event by showing dashboard when token is added", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);
			expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();

			localStorage.setItem("token", "test-token");
			act(() => {
				window.dispatchEvent(new Event("authChanged"));
			});

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
		});
	});

	describe("dashboard data display", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
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

		it("shows empty state message when apiKeys is empty", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [],
				summary: { totalApiKeys: 0, totalUsage: 0 },
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("No API keys yet.")).toBeInTheDocument();
				expect(
					screen.getByRole("button", { name: "Create one to get started" }),
				).toBeInTheDocument();
			});
		});

		it("renders API key card with name and masked prefix", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
				expect(screen.getByText(/pk_abc/)).toBeInTheDocument();
			});
		});

		it("renders the tier badge", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("PRO")).toBeInTheDocument();
			});
		});

		it("renders monthly usage count and limit", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				// monthly used = 10000 - 8000 = 2000
				expect(screen.getByText(/2,000 \/ 10,000/)).toBeInTheDocument();
			});
		});

		it("shows last used time when lastUsed is present", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/last used/)).toBeInTheDocument();
			});
		});

		it("shows 'never' when lastUsed is null", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, lastUsed: null }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/last used never/)).toBeInTheDocument();
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
					screen.getByText(/Error: Network failure/),
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
					screen.getByText(/Error: Unauthorized access/),
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
					screen.getByText(/Error: Token expired/),
				).toBeInTheDocument();
			});
		});

		it("shows Try again button in error state", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Try again" }),
				).toBeInTheDocument();
			});
		});
	});

	describe("cancel subscription", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		async function openKeyMenu() {
			await screen.findByText("My Key");
			fireEvent.click(screen.getByRole("button", { name: /More options for My Key/ }));
		}

		it("shows cancel subscription option in key menu for non-HOBBY ACTIVE keys", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);
			await openKeyMenu();

			expect(
				screen.getByRole("button", { name: /Cancel subscription/ }),
			).toBeInTheDocument();
		});

		it("does not show cancel subscription option for HOBBY tier", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, tier: "HOBBY" }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);
			await openKeyMenu();

			expect(
				screen.queryByRole("button", { name: /Cancel subscription/ }),
			).not.toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "Revoke key" }),
			).toBeInTheDocument();
		});

		it("does not show cancel option for INACTIVE keys", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, keyStatus: "INACTIVE" }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);
			await openKeyMenu();

			expect(
				screen.queryByRole("button", { name: /Cancel subscription/ }),
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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: /Cancel subscription/ }));

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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: /Cancel subscription/ }));

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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: /Cancel subscription/ }));

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("forgot API key", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		async function openKeyMenu() {
			await screen.findByText("My Key");
			fireEvent.click(screen.getByRole("button", { name: /More options for My Key/ }));
		}

		it("shows Forgot API key option in key menu for non-HOBBY ACTIVE keys", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);
			await openKeyMenu();

			expect(
				screen.getByRole("button", { name: "Forgot API key" }),
			).toBeInTheDocument();
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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

			await waitFor(() => {
				expect(
					screen.getByText("New API key generated"),
				).toBeInTheDocument();
			});

			fireEvent.click(screen.getByRole("button", { name: "Close" }));

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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

			const copyBtn = await screen.findByRole("button", { name: "Copy API key" });
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
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

			const copyBtn = await screen.findByRole("button", { name: "Copy API key" });
			fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Copy failed" }),
				).toBeInTheDocument();
			});
		});
	});

	describe("add API key", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		it("shows '+ Add key' button when keys already exist", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_DASHBOARD_DATA),
			);

			render(<Dashboard />);
			await screen.findByText("My Key");

			expect(
				screen.getAllByRole("button", { name: "+ Add key" }).length,
			).toBeGreaterThan(0);
		});

		it("disables add key button and shows limit message when at tier cap", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, tier: "HOBBY" }],
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));

			render(<Dashboard />);
			await screen.findByText("My Key");

			const limitButtons = screen.getAllByRole("button", {
				name: "Key limit reached",
			});
			expect(limitButtons.length).toBeGreaterThan(0);
			for (const btn of limitButtons) {
				expect(btn).toBeDisabled();
			}
		});

		it("creates a new key and shows it in the reveal modal", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse(
						{
							apiKey: {
								name: "Staging key",
								tier: "PRO",
								keyStatus: "ACTIVE",
								keyPrefix: "pk_pro_staging",
								key: "pk_pro_staging_secret",
								permissions: ["read:pubs"],
							},
						},
						201,
					),
				)
				.mockResolvedValueOnce(
					jsonResponse({
						...SAMPLE_DASHBOARD_DATA,
						apiKeys: [
							SAMPLE_API_KEY,
							{ ...SAMPLE_API_KEY, name: "Staging key", keyPrefix: "pk_pro_staging" },
						],
					}),
				);

			render(<Dashboard />);
			await screen.findByText("My Key");

			fireEvent.click(screen.getAllByRole("button", { name: "+ Add key" })[0]);

			const nameInput = await screen.findByPlaceholderText("e.g. Staging key");
			fireEvent.change(nameInput, { target: { value: "Staging key" } });
			fireEvent.click(screen.getByRole("button", { name: "Create key" }));

			await waitFor(() => {
				expect(
					screen.getByText("New API key generated"),
				).toBeInTheDocument();
				expect(screen.getByText("pk_pro_staging_secret")).toBeInTheDocument();
			});
		});

		it("shows the 409 tier-limit error inside the add key modal", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse(
						{
							error:
								"Your PRO plan allows up to 3 API keys. Delete an existing key or upgrade your plan to create another.",
						},
						409,
					),
				);

			render(<Dashboard />);
			await screen.findByText("My Key");

			fireEvent.click(screen.getAllByRole("button", { name: "+ Add key" })[0]);
			fireEvent.click(screen.getByRole("button", { name: "Create key" }));

			await waitFor(() => {
				expect(
					screen.getByText(/Your PRO plan allows up to 3 API keys/),
				).toBeInTheDocument();
			});
		});
	});

	describe("revoke API key", () => {
		beforeEach(() => {
			localStorage.setItem("token", "test-token");
		});

		async function openKeyMenu() {
			await screen.findByText("My Key");
			fireEvent.click(screen.getByRole("button", { name: /More options for My Key/ }));
		}

		it("revokes a key on confirm and refreshes the list", async () => {
			let dashboardCallCount = 0;
			vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
				const method = init?.method ?? "GET";
				if (method === "DELETE") return jsonResponse({ success: true });
				dashboardCallCount += 1;
				return dashboardCallCount === 1
					? jsonResponse(SAMPLE_DASHBOARD_DATA)
					: jsonResponse({
							...SAMPLE_DASHBOARD_DATA,
							apiKeys: [],
							summary: { totalApiKeys: 0, totalUsage: 0 },
						});
			});
			vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Revoke key" }));

			await waitFor(() => {
				expect(screen.getByText("No API keys yet.")).toBeInTheDocument();
			});
		});

		it("revokes the specific key's id, not just the first key", async () => {
			const secondKey = { ...SAMPLE_API_KEY, id: "key_2", name: "Second Key", keyPrefix: "pk_def" };
			const data = { ...SAMPLE_DASHBOARD_DATA, apiKeys: [SAMPLE_API_KEY, secondKey] };
			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(data))
				.mockResolvedValueOnce(jsonResponse({ success: true }))
				.mockResolvedValueOnce(jsonResponse(data));
			vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<Dashboard />);
			await screen.findByText("Second Key");
			fireEvent.click(
				screen.getByRole("button", { name: /More options for Second Key/ }),
			);
			fireEvent.click(screen.getByRole("button", { name: "Revoke key" }));

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledWith(
					"/api/auth/keys/key_2",
					expect.objectContaining({ method: "DELETE" }),
				);
			});
		});

		it("shows an error message when revoke fails", async () => {
			vi.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(jsonResponse(SAMPLE_DASHBOARD_DATA))
				.mockResolvedValueOnce(
					jsonResponse({ error: "Key not found" }, 404),
				);
			vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Revoke key" }));

			await waitFor(() => {
				expect(screen.getByText("Key not found")).toBeInTheDocument();
			});
		});

		it("does not revoke when the user dismisses the confirm dialog", async () => {
			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValue(jsonResponse(SAMPLE_DASHBOARD_DATA));
			vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Revoke key" }));

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledTimes(1);
			});
		});
	});
});
