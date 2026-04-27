import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearBeerTypesCache } from "@/hooks/useBeerTypes";
import { clearCountriesCache } from "@/hooks/useCountries";

import PubPage from "./page";

vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "pub-123" }),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		...props
	}: {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		className?: string;
	}) => <img src={src} alt={alt} {...props} />,
}));

vi.mock("../../features/opening-hours/opening-hours-editor", () => ({
	default: () => <div data-testid="opening-hours-editor" />,
}));

// ---- helpers ----

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const SAMPLE_PUB = {
	id: "pub-123",
	name: "The Harp",
	city: "London",
	address: "47 Chandos Place",
	postcode: "WC2N 4HS",
	country: "GB",
	createdAt: "2023-01-15T10:00:00Z",
	website: "https://theharp.co.uk",
	description: "A classic pub in Covent Garden.",
	hasFood: true,
	isDogFriendly: false,
	beerGardens: [],
	beerTypes: [],
};

type FetchMockOptions = {
	pubData?: Record<string, unknown>;
	pubStatus?: number;
	patchData?: Record<string, unknown>;
	patchStatus?: number;
	authData?: Record<string, unknown> | null;
	authStatus?: number;
};

function setupFetchMock({
	pubData = SAMPLE_PUB,
	pubStatus = 200,
	patchData,
	patchStatus = 200,
	authData = null,
	authStatus = 401,
}: FetchMockOptions = {}) {
	return vi
		.spyOn(globalThis, "fetch")
		.mockImplementation(async (input, init?) => {
			const url =
				typeof input === "string" ? input : (input as Request).url;

			if (url.endsWith("/auth/me")) {
				return authData
					? jsonResponse(authData, authStatus)
					: new Response(null, { status: authStatus });
			}

			if (/\/pubs\//.test(url)) {
				if ((init as RequestInit | undefined)?.method === "PATCH") {
					return jsonResponse(patchData ?? pubData, patchStatus);
				}
				return jsonResponse(pubData, pubStatus);
			}

			if (url.includes("/api/beer-types")) {
				return jsonResponse([
					{ id: "bt1", name: "Ale", isActive: true },
					{ id: "bt2", name: "Lager", isActive: true },
				]);
			}

			if (url.includes("restcountries.com")) {
				return jsonResponse([
					{ name: { common: "United Kingdom" }, cca2: "GB" },
					{ name: { common: "United States" }, cca2: "US" },
				]);
			}

			throw new Error(`Unexpected fetch URL: ${url}`);
		});
}

async function renderPageAsAdmin() {
	localStorage.setItem("token", "header.payload.signature");
	const fetchSpy = setupFetchMock({
		authData: { email: "admin@example.com", approved: true, admin: true },
		authStatus: 200,
	});
	render(<PubPage />);
	await screen.findByRole("heading", { name: "The Harp" });
	await screen.findByRole("button", { name: "Edit this pub" });
	return fetchSpy;
}

describe("PubPage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		clearBeerTypesCache();
		clearCountriesCache();
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	describe("loading and fetch states", () => {
		it("shows loading state initially", () => {
			vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
			render(<PubPage />);
			expect(screen.getByText("Loading pub details…")).toBeInTheDocument();
		});

		it('shows "Pub not found" when the fetch returns a non-ok response', async () => {
			setupFetchMock({ pubStatus: 404 });
			render(<PubPage />);
			expect(await screen.findByText("Pub not found")).toBeInTheDocument();
		});

		it('shows "Pub not found" when the fetch throws a network error', async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(
				new Error("Network error"),
			);
			render(<PubPage />);
			expect(await screen.findByText("Pub not found")).toBeInTheDocument();
		});
	});

	describe("pub display", () => {
		it("renders the pub name as a heading", async () => {
			setupFetchMock();
			render(<PubPage />);
			expect(
				await screen.findByRole("heading", { name: "The Harp" }),
			).toBeInTheDocument();
		});

		it("renders the pub city, address, and postcode", async () => {
			setupFetchMock();
			render(<PubPage />);
			await screen.findByRole("heading", { name: "The Harp" });
			expect(screen.getByText(/London/)).toBeInTheDocument();
			expect(screen.getByText(/47 Chandos Place/)).toBeInTheDocument();
			expect(screen.getByText(/WC2N 4HS/)).toBeInTheDocument();
		});

		it("renders a pub image when imageUrl is present", async () => {
			setupFetchMock({
				pubData: { ...SAMPLE_PUB, imageUrl: "https://example.com/pub.jpg" },
			});
			render(<PubPage />);
			await screen.findByRole("heading", { name: "The Harp" });
			const img = screen.getByRole("img", { name: "The Harp" });
			expect(img).toHaveAttribute("src", "https://example.com/pub.jpg");
		});

		it("does not render an image when imageUrl is absent", async () => {
			setupFetchMock();
			render(<PubPage />);
			await screen.findByRole("heading", { name: "The Harp" });
			expect(screen.queryByRole("img")).not.toBeInTheDocument();
		});

		it("renders a clickable external website link", async () => {
			setupFetchMock();
			render(<PubPage />);
			await screen.findByRole("heading", { name: "The Harp" });
			const link = screen.getByRole("link", { name: "Visit The Harp website (opens in new tab)" });
			expect(link).toHaveAttribute("href", "https://theharp.co.uk");
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		});

		it("renders beer garden details when present", async () => {
			setupFetchMock({
				pubData: {
					...SAMPLE_PUB,
					beerGardens: [
						{
							id: "garden-1",
							name: "Back Garden",
							description: "A lovely garden",
							isCovered: true,
							isHeated: false,
							petFriendly: true,
						},
					],
				},
			});
			render(<PubPage />);
			await screen.findByRole("heading", { name: "The Harp" });
			expect(screen.getByText("Back Garden")).toBeInTheDocument();
		});

		it("renders boolean amenity fields correctly", async () => {
			setupFetchMock({
				pubData: { ...SAMPLE_PUB, hasFood: true, isDogFriendly: false },
			});
			render(<PubPage />);
			await screen.findByRole("heading", { name: "The Harp" });
			expect(screen.getByText(/Food available/)).toBeInTheDocument();
			expect(screen.getByText(/Dog friendly/)).toBeInTheDocument();
		});
	});

	describe("auth states (EditButton)", () => {
		it('shows a "Log in to edit this pub" link when no token is present', async () => {
			setupFetchMock();
			render(<PubPage />);
			const link = await screen.findByRole("link", {
				name: "Log in to edit this pub",
			});
			expect(link).toHaveAttribute("href", "/register");
		});

		it("shows the approval message for unapproved users", async () => {
			localStorage.setItem("token", "header.payload.signature");
			setupFetchMock({
				authData: {
					email: "user@example.com",
					approved: false,
					admin: false,
				},
				authStatus: 200,
			});
			render(<PubPage />);
			expect(
				await screen.findByText(
					"Your account is not approved for editing.",
				),
			).toBeInTheDocument();
		});

		it("shows the Edit button for an approved non-admin user", async () => {
			localStorage.setItem("token", "header.payload.signature");
			setupFetchMock({
				authData: {
					email: "editor@example.com",
					approved: true,
					admin: false,
				},
				authStatus: 200,
			});
			render(<PubPage />);
			expect(
				await screen.findByRole("button", { name: "Edit this pub" }),
			).toBeInTheDocument();
		});

		it("does not show the Delete button for non-admin approved users", async () => {
			localStorage.setItem("token", "header.payload.signature");
			setupFetchMock({
				authData: {
					email: "editor@example.com",
					approved: true,
					admin: false,
				},
				authStatus: 200,
			});
			render(<PubPage />);
			await screen.findByRole("button", { name: "Edit this pub" });
			expect(
				screen.queryByRole("button", { name: "Delete this pub" }),
			).not.toBeInTheDocument();
		});

		it("shows the Delete button only for admin users", async () => {
			localStorage.setItem("token", "header.payload.signature");
			setupFetchMock({
				authData: {
					email: "admin@example.com",
					approved: true,
					admin: true,
				},
				authStatus: 200,
			});
			render(<PubPage />);
			expect(
				await screen.findByRole("button", { name: "Delete this pub" }),
			).toBeInTheDocument();
		});

		it("falls back to JWT decoding when /auth/me is unavailable", async () => {
			const payload = btoa(
				JSON.stringify({
					email: "admin@example.com",
					approved: true,
					admin: true,
				}),
			);
			localStorage.setItem("token", `header.${payload}.signature`);
			vi.spyOn(globalThis, "fetch").mockImplementation(
				async (input, init?) => {
					const url =
						typeof input === "string" ? input : (input as Request).url;
					if (url.endsWith("/auth/me")) {
						throw new Error("API unavailable");
					}
					if (/\/pubs\//.test(url)) {
						return jsonResponse(SAMPLE_PUB);
					}
					if (url.includes("/api/beer-types")) {
						return jsonResponse([]);
					}
					if (url.includes("restcountries.com")) {
						return jsonResponse([]);
					}
					throw new Error(`Unexpected fetch URL: ${url}`);
				},
			);
			render(<PubPage />);
			expect(
				await screen.findByRole("button", { name: "Edit this pub" }),
			).toBeInTheDocument();
		});
	});

	describe("edit mode", () => {
		// The edit form renders two Save buttons (top and bottom of the form).
		// These helpers always interact with the first one.
		async function waitForSaveButton() {
			await waitFor(() => {
				expect(
					screen.getAllByRole("button", { name: "Save" }).length,
				).toBeGreaterThan(0);
			});
			return screen.getAllByRole("button", { name: "Save" })[0];
		}

		it("shows Save and Cancel buttons when Edit is clicked", async () => {
			await renderPageAsAdmin();
			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			const saveBtn = await waitForSaveButton();
			expect(saveBtn).toBeInTheDocument();
			expect(
				screen.getAllByRole("button", { name: "Cancel" })[0],
			).toBeInTheDocument();
		});

		it("returns to view mode when Cancel is clicked", async () => {
			await renderPageAsAdmin();
			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			await waitForSaveButton();
			fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
			await waitFor(() => {
				expect(
					screen.queryAllByRole("button", { name: "Save" }),
				).toHaveLength(0);
			});
			expect(
				await screen.findByRole("button", { name: "Edit this pub" }),
			).toBeInTheDocument();
		});

		it("Save button is enabled when all required fields are populated", async () => {
			await renderPageAsAdmin();
			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			const saveBtn = await waitForSaveButton();
			expect(saveBtn).not.toBeDisabled();
		});

		it("sends a PATCH request to the correct URL on save", async () => {
			const fetchSpy = await renderPageAsAdmin();
			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			const saveBtn = await waitForSaveButton();
			fireEvent.click(saveBtn);

			await waitFor(() => {
				const patchCall = fetchSpy.mock.calls.find(
					([, init]) =>
						(init as RequestInit | undefined)?.method === "PATCH",
				);
				expect(patchCall).toBeDefined();
				const url = patchCall![0] as string;
				expect(url).toContain("/pubs/pub-123");
			});
		});

		it("updates the pub heading after a successful save", async () => {
			await renderPageAsAdmin();

			vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
				jsonResponse({ ...SAMPLE_PUB, name: "The Harp (Renamed)" }),
			);

			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			fireEvent.click(await waitForSaveButton());

			expect(
				await screen.findByRole("heading", { name: "The Harp (Renamed)" }),
			).toBeInTheDocument();
		});

		it("exits edit mode after a successful save", async () => {
			await renderPageAsAdmin();

			vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
				jsonResponse(SAMPLE_PUB),
			);

			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			fireEvent.click(await waitForSaveButton());

			await waitFor(() => {
				expect(
					screen.queryAllByRole("button", { name: "Save" }),
				).toHaveLength(0);
			});
		});

		it("shows an error message when save fails with an API error", async () => {
			await renderPageAsAdmin();

			vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
				jsonResponse({ error: "Permission denied" }, 403),
			);

			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			fireEvent.click(await waitForSaveButton());

			expect(await screen.findByText("Permission denied")).toBeInTheDocument();
		});

		it("shows a network error message when the save request throws", async () => {
			await renderPageAsAdmin();

			vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => {
				throw new Error("Connection refused");
			});

			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			fireEvent.click(await waitForSaveButton());

			expect(await screen.findByText("Network error")).toBeInTheDocument();
		});

		it("shows validation error when Save is clicked with an invalid website URL", async () => {
			await renderPageAsAdmin();
			fireEvent.click(screen.getByRole("button", { name: "Edit this pub" }));
			await waitForSaveButton();

			fireEvent.change(screen.getByLabelText(/Website:/), {
				target: { value: "not-a-url" },
			});

			expect(
				await screen.findByText(
					"Please enter a valid URL (include http:// or https://)",
				),
			).toBeInTheDocument();
			expect(
				screen.getAllByRole("button", { name: "Save" })[0],
			).toBeDisabled();
		});
	});
});
