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

function toUrl(input: RequestInfo | URL): string {
	if (typeof input === "string") return input;
	if (input instanceof URL) return input.toString();
	return input.url;
}

function authMeResponse(authenticated = true): Response {
	return authenticated
		? jsonResponse({ email: "alice@example.com" })
		: jsonResponse({}, 401);
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
};

const SAMPLE_SUBSCRIPTION = {
	tier: "PRO",
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
	subscription: SAMPLE_SUBSCRIPTION,
	summary: { totalApiKeys: 1, totalUsage: 42 },
};

const SAMPLE_USAGE_DATA = { range: "30d", bucket: "day", series: [] };

type FetchRouterOptions = {
	dashboardData?: unknown;
	usageData?: unknown;
	authenticated?: boolean;
	onRequest?: (
		url: string,
		init?: RequestInit,
	) => Response | Promise<Response> | undefined;
};

function createDashboardFetchMock(options: FetchRouterOptions = {}) {
	let dashboardData: unknown = options.dashboardData ?? SAMPLE_DASHBOARD_DATA;
	const usageData = options.usageData ?? SAMPLE_USAGE_DATA;
	const authenticated = options.authenticated ?? true;
	const onRequest = options.onRequest;

	const spy = vi
		.spyOn(globalThis, "fetch")
		.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = toUrl(input);
			if (url.includes("/auth/me")) return authMeResponse(authenticated);
			if (url.includes("/dashboard/usage")) return jsonResponse(usageData);
			if (onRequest) {
				const custom = await onRequest(url, init);
				if (custom) return custom;
			}
			if (url.includes("/auth/dashboard")) return jsonResponse(dashboardData);
			throw new Error(`Unexpected fetch: ${url} ${init?.method ?? "GET"}`);
		});

	return {
		spy,
		setDashboardData(next: unknown) {
			dashboardData = next;
		},
	};
}

describe("Dashboard", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("authentication", () => {
		it("shows a sign-in prompt when not authenticated", () => {
			createDashboardFetchMock({ authenticated: false });

			render(<Dashboard />);

			expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
		});

		it("fetches dashboard data when logged in", async () => {
			createDashboardFetchMock();

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
		});

		it("reacts to authChanged event by showing dashboard when the user logs in", async () => {
			let authenticated = false;
			vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
				const url = toUrl(input);
				if (url.includes("/auth/me")) return authMeResponse(authenticated);
				if (url.includes("/dashboard/usage")) return jsonResponse(SAMPLE_USAGE_DATA);
				if (url.includes("/auth/dashboard")) return jsonResponse(SAMPLE_DASHBOARD_DATA);
				throw new Error(`Unexpected fetch: ${url}`);
			});

			render(<Dashboard />);
			await waitFor(() => {
				expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
			});

			authenticated = true;
			act(() => {
				window.dispatchEvent(new Event("authChanged"));
			});

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
		});
	});

	describe("dashboard data display", () => {
		it("shows pending approval warning when not approved", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				user: { ...SAMPLE_DASHBOARD_DATA.user, approved: false },
			};
			createDashboardFetchMock({ dashboardData: data });

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
			createDashboardFetchMock({ dashboardData: data });

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
			createDashboardFetchMock({ dashboardData: data });

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("No API keys yet.")).toBeInTheDocument();
				expect(
					screen.getByRole("button", { name: "Create one to get started" }),
				).toBeInTheDocument();
			});
		});

		it("renders without crashing when subscription is absent (e.g. no keys yet)", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [],
				subscription: undefined,
				summary: { totalApiKeys: 0, totalUsage: 0 },
			};
			createDashboardFetchMock({ dashboardData: data });

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("No API keys yet.")).toBeInTheDocument();
			});
		});

		it("renders a key missing an id without a React key warning, using keyPrefix as a fallback identity", async () => {
			const data = {
				...SAMPLE_DASHBOARD_DATA,
				apiKeys: [{ ...SAMPLE_API_KEY, id: undefined }],
			};
			createDashboardFetchMock({ dashboardData: data });

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
			});
		});

		it("renders API key card with name and masked prefix", async () => {
			createDashboardFetchMock();

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("My Key")).toBeInTheDocument();
				expect(screen.getByText(/pk_abc/)).toBeInTheDocument();
			});
		});

		it("renders the tier badge", async () => {
			createDashboardFetchMock();

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText("PRO")).toBeInTheDocument();
			});
		});

		it("renders the key's lifetime usage count", async () => {
			createDashboardFetchMock();

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/42 requests all-time/)).toBeInTheDocument();
			});
		});

		it("renders the account-level monthly usage total from the subscription", async () => {
			createDashboardFetchMock();

			render(<Dashboard />);

			await waitFor(() => {
				// monthly used = 10000 - 8000 = 2000
				expect(screen.getByText(/2,000/)).toBeInTheDocument();
			});
		});

		it("shows last used time when lastUsed is present", async () => {
			createDashboardFetchMock();

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
			createDashboardFetchMock({ dashboardData: data });

			render(<Dashboard />);

			await waitFor(() => {
				expect(screen.getByText(/last used never/)).toBeInTheDocument();
			});
		});
	});

	describe("error handling", () => {
		it("shows error message when fetch fails with network error", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
				const url = toUrl(input);
				if (url.includes("/auth/me")) return authMeResponse(true);
				if (url.includes("/dashboard/usage")) return jsonResponse(SAMPLE_USAGE_DATA);
				throw new Error("Network failure");
			});

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Error: Network failure/),
				).toBeInTheDocument();
			});
		});

		it("shows error message from API error response", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
				const url = toUrl(input);
				if (url.includes("/auth/me")) return authMeResponse(true);
				if (url.includes("/dashboard/usage")) return jsonResponse(SAMPLE_USAGE_DATA);
				return jsonResponse({ message: "Unauthorized access" }, 401);
			});

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Error: Unauthorized access/),
				).toBeInTheDocument();
			});
		});

		it("shows error.error field when message is absent", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
				const url = toUrl(input);
				if (url.includes("/auth/me")) return authMeResponse(true);
				if (url.includes("/dashboard/usage")) return jsonResponse(SAMPLE_USAGE_DATA);
				return jsonResponse({ error: "Token expired" }, 403);
			});

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByText(/Error: Token expired/),
				).toBeInTheDocument();
			});
		});

		it("shows Try again button in error state", async () => {
			vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
				const url = toUrl(input);
				if (url.includes("/auth/me")) return authMeResponse(true);
				if (url.includes("/dashboard/usage")) return jsonResponse(SAMPLE_USAGE_DATA);
				throw new Error("fail");
			});

			render(<Dashboard />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: "Try again" }),
				).toBeInTheDocument();
			});
		});
	});

	describe("cancel subscription", () => {
		async function openKeyMenu() {
			await screen.findByText("My Key");
			fireEvent.click(screen.getByRole("button", { name: /More options for My Key/ }));
		}

		it("shows cancel subscription option in key menu for non-HOBBY ACTIVE keys", async () => {
			createDashboardFetchMock();

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
			createDashboardFetchMock({ dashboardData: data });

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
			createDashboardFetchMock({ dashboardData: data });

			render(<Dashboard />);
			await openKeyMenu();

			expect(
				screen.queryByRole("button", { name: /Cancel subscription/ }),
			).not.toBeInTheDocument();
		});

		it("shows success message after cancellation", async () => {
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/payments/cancel-subscription") && init?.method === "POST") {
						return jsonResponse({ message: "Subscription cancelled successfully." });
					}
					return undefined;
				},
			});
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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/payments/cancel-subscription") && init?.method === "POST") {
						return jsonResponse({ message: "Failed to cancel" }, 500);
					}
					return undefined;
				},
			});
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
			const { spy: fetchSpy } = createDashboardFetchMock();
			vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: /Cancel subscription/ }));

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledTimes(3);
			});
		});
	});

	describe("forgot API key", () => {
		async function openKeyMenu() {
			await screen.findByText("My Key");
			fireEvent.click(screen.getByRole("button", { name: /More options for My Key/ }));
		}

		it("shows Forgot API key option in key menu for non-HOBBY ACTIVE keys", async () => {
			createDashboardFetchMock();

			render(<Dashboard />);
			await openKeyMenu();

			expect(
				screen.getByRole("button", { name: "Forgot API key" }),
			).toBeInTheDocument();
		});

		it("shows success message after forgot API key (no new key in response)", async () => {
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/regenerate") && init?.method === "POST") {
						return jsonResponse({ message: "API key reminder sent to your email." });
					}
					return undefined;
				},
			});

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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/regenerate") && init?.method === "POST") {
						return jsonResponse({ message: "Key not found" }, 404);
					}
					return undefined;
				},
			});

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Forgot API key" }));

			await waitFor(() => {
				expect(screen.getByText("Key not found")).toBeInTheDocument();
			});
		});

		it("opens modal with new key when API returns apiKey in response", async () => {
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/regenerate") && init?.method === "POST") {
						return jsonResponse({
							message: "New key generated.",
							apiKey: {
								name: "My Key",
								tier: "PRO",
								keyStatus: "ACTIVE",
								keyPrefix: "pk_abc",
								key: "pk_abc_supersecretkey",
								permissions: ["read"],
							},
						});
					}
					return undefined;
				},
			});

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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/regenerate") && init?.method === "POST") {
						return jsonResponse({
							message: "New key generated.",
							apiKey: {
								name: "My Key",
								tier: "PRO",
								keyStatus: "ACTIVE",
								keyPrefix: "pk_abc",
								key: "pk_abc_supersecretkey",
								permissions: [],
							},
						});
					}
					return undefined;
				},
			});

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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/regenerate") && init?.method === "POST") {
						return jsonResponse({
							message: "New key generated.",
							apiKey: {
								name: "My Key",
								tier: "PRO",
								keyStatus: "ACTIVE",
								keyPrefix: "pk_abc",
								key: "pk_abc_supersecretkey",
								permissions: [],
							},
						});
					}
					return undefined;
				},
			});

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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/regenerate") && init?.method === "POST") {
						return jsonResponse({
							message: "New key generated.",
							apiKey: {
								name: "My Key",
								tier: "PRO",
								keyStatus: "ACTIVE",
								keyPrefix: "pk_abc",
								key: "pk_abc_supersecretkey",
								permissions: [],
							},
						});
					}
					return undefined;
				},
			});

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
		it("shows '+ Add key' button when keys already exist", async () => {
			createDashboardFetchMock();

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
				subscription: { ...SAMPLE_SUBSCRIPTION, tier: "HOBBY" },
			};
			createDashboardFetchMock({ dashboardData: data });

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
			const { setDashboardData } = createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.endsWith("/auth/keys") && init?.method === "POST") {
						setDashboardData({
							...SAMPLE_DASHBOARD_DATA,
							apiKeys: [
								SAMPLE_API_KEY,
								{ ...SAMPLE_API_KEY, name: "Staging key", keyPrefix: "pk_pro_staging" },
							],
						});
						return jsonResponse(
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
						);
					}
					return undefined;
				},
			});

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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.endsWith("/auth/keys") && init?.method === "POST") {
						return jsonResponse(
							{
								error:
									"Your PRO plan allows up to 3 API keys. Delete an existing key or upgrade your plan to create another.",
							},
							409,
						);
					}
					return undefined;
				},
			});

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
		async function openKeyMenu() {
			await screen.findByText("My Key");
			fireEvent.click(screen.getByRole("button", { name: /More options for My Key/ }));
		}

		it("revokes a key on confirm and refreshes the list", async () => {
			let dashboardCallCount = 0;
			vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
				const url = toUrl(input);
				const method = init?.method ?? "GET";
				if (url.includes("/auth/me")) return authMeResponse(true);
				if (url.includes("/dashboard/usage")) return jsonResponse(SAMPLE_USAGE_DATA);
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

		it("revokes the specific key's id, not just the first key, even when keyPrefix is shared", async () => {
			const secondKey = { ...SAMPLE_API_KEY, id: "key_2", name: "Second Key" };
			const data = { ...SAMPLE_DASHBOARD_DATA, apiKeys: [SAMPLE_API_KEY, secondKey] };
			const { spy: fetchSpy } = createDashboardFetchMock({
				dashboardData: data,
				onRequest: (url, init) => {
					if (url.includes("/auth/keys/key_2") && init?.method === "DELETE") {
						return jsonResponse({ success: true });
					}
					return undefined;
				},
			});
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
			createDashboardFetchMock({
				onRequest: (url, init) => {
					if (url.includes("/auth/keys/") && init?.method === "DELETE") {
						return jsonResponse({ error: "Key not found" }, 404);
					}
					return undefined;
				},
			});
			vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Revoke key" }));

			await waitFor(() => {
				expect(screen.getByText("Key not found")).toBeInTheDocument();
			});
		});

		it("does not revoke when the user dismisses the confirm dialog", async () => {
			const { spy: fetchSpy } = createDashboardFetchMock();
			vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<Dashboard />);
			await openKeyMenu();

			fireEvent.click(screen.getByRole("button", { name: "Revoke key" }));

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledTimes(3);
			});
		});
	});
});
