import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

vi.mock("@/hooks/useTheme", () => ({
	useTheme: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import SettingsPage from "./page";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function openDangerZone() {
	fireEvent.click(screen.getByRole("button", { name: /Danger zone/i }));
}

function submitDeleteForm() {
	const form = screen.getByRole("button", { name: /Confirm delete/i }).closest("form");
	if (!form) {
		throw new Error("Confirm delete form not found");
	}
	return form;
}

describe("SettingsPage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
		vi.mocked(useTheme).mockReturnValue({
			theme: "light",
			setTheme: vi.fn(),
			toggleTheme: vi.fn(),
		});
	});

	it("shows an auth gate when the user is not authenticated", () => {
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
		render(<SettingsPage />);
		expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
	});

	it("shows the Settings heading when authenticated", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
	});

	it("shows the Danger zone nav item when authenticated", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		expect(screen.getByRole("button", { name: /Danger zone/i })).toBeInTheDocument();
	});

	it("initially shows the Delete account button and hides the confirmation form", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		openDangerZone();
		expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
		expect(screen.queryByPlaceholderText("••••••••")).not.toBeInTheDocument();
	});

	it("clicking Delete account reveals the confirmation form", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		openDangerZone();
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Confirm delete/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
	});

	it("Cancel hides the confirmation form and restores the initial Delete button", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		openDangerZone();
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
		expect(screen.queryByPlaceholderText("••••••••")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
	});

	it("on success clears the auth cookie via /api/auth/logout, dispatches authChanged, and redirects to /", async () => {
		const push = vi.fn();
		vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(null, { status: 200 }));
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");

		render(<SettingsPage />);
		openDangerZone();
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "my-password" },
		});
		await act(async () => {
			fireEvent.submit(submitDeleteForm());
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
		expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
		expect(push).toHaveBeenCalledWith("/");
	});

	it("shows 'Incorrect password.' for a 401 with 'Invalid credentials'", async () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Invalid credentials" }, 401)
		);

		render(<SettingsPage />);
		openDangerZone();
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "wrong-password" },
		});
		await act(async () => {
			fireEvent.submit(submitDeleteForm());
		});

		await waitFor(() => {
			expect(screen.getByText("Incorrect password.")).toBeInTheDocument();
		});
	});

	it("shows 'Password is required.' for a 400 response with errors", async () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ errors: ["Password is required"] }, 400)
		);

		render(<SettingsPage />);
		openDangerZone();
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "x" },
		});
		await act(async () => {
			fireEvent.submit(submitDeleteForm());
		});

		await waitFor(() => {
			expect(screen.getByText("Password is required.")).toBeInTheDocument();
		});
	});

	it("shows a generic error message when fetch throws", async () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

		render(<SettingsPage />);
		openDangerZone();
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "my-password" },
		});
		await act(async () => {
			fireEvent.submit(submitDeleteForm());
		});

		await waitFor(() => {
			expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
		});
	});

	describe("ProfileTab", () => {
		const profileUser = {
			email: "alice@example.com",
			approved: true,
			name: "Alice",
			username: "alice123",
			image: "",
			location: "London",
			bio: "Pub enthusiast",
		};

		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({ user: profileUser, isApproved: true, isAdmin: false });
		});

		it("renders initial profile field values from the user", () => {
			render(<SettingsPage />);
			expect(screen.getByLabelText("Display name")).toHaveValue("Alice");
			expect(screen.getByLabelText("Username")).toHaveValue("alice123");
			expect(screen.getByLabelText("City")).toHaveValue("London");
			expect(screen.getByLabelText("Bio")).toHaveValue("Pub enthusiast");
		});

		it("disables Save changes until a field is edited", () => {
			render(<SettingsPage />);
			expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
			fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice B" } });
			expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
		});

		it("PATCHes only the changed fields", async () => {
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice B" } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/auth/me",
				expect.objectContaining({
					method: "PATCH",
					body: JSON.stringify({ name: "Alice B" }),
				})
			);
		});

		it("shows 'Changes saved.' and dispatches authChanged on success", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
			const dispatchSpy = vi.spyOn(window, "dispatchEvent");
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice B" } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Changes saved.")).toBeInTheDocument();
			});
			expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
		});

		it("shows a username-taken field error on 409", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ error: "Username already taken" }, 409)
			);
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Username"), { target: { value: "taken" } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Username already taken")).toBeInTheDocument();
			});
		});

		it("shows field errors from a 400 response", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ errors: { fieldErrors: { bio: ["Bio is too long"] } } }, 400)
			);
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "x".repeat(300) } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Bio is too long")).toBeInTheDocument();
			});
		});

		it("shows a session-expired message on 401", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice B" } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Session expired — please log in again.")).toBeInTheDocument();
			});
		});

		it("shows a generic error on other failure statuses", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice B" } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
			});
		});

		it("shows a generic error when fetch throws", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));
			render(<SettingsPage />);
			fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice B" } });
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
			});
		});
	});

	describe("SecurityTab", () => {
		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({
				user: { email: "alice@example.com", approved: true },
				isApproved: true,
				isAdmin: false,
			});
		});

		function openSecurityTab() {
			fireEvent.click(screen.getByRole("button", { name: "Security" }));
		}

		function fillPasswordFields(current: string, next: string, confirm: string) {
			fireEvent.change(screen.getByLabelText("Current password"), { target: { value: current } });
			fireEvent.change(screen.getByLabelText("New password"), { target: { value: next } });
			fireEvent.change(screen.getByLabelText("Confirm new password"), {
				target: { value: confirm },
			});
		}

		it("disables Save changes until all three password fields are filled", () => {
			render(<SettingsPage />);
			openSecurityTab();
			expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
			fillPasswordFields("current-pw", "new-pw", "new-pw");
			expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
		});

		it("shows a validation error when the new and confirm passwords don't match", async () => {
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "new-pw", "different-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
		});

		it("PATCHes /api/auth/me/password with the current and new passwords", async () => {
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "new-pw", "new-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/auth/me/password",
				expect.objectContaining({
					method: "PATCH",
					body: JSON.stringify({ currentPassword: "current-pw", newPassword: "new-pw" }),
				})
			);
		});

		it("clears the fields and shows 'Password updated.' on success", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "new-pw", "new-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Password updated.")).toBeInTheDocument();
			});
			expect(screen.getByLabelText("Current password")).toHaveValue("");
			expect(screen.getByLabelText("New password")).toHaveValue("");
			expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
		});

		it("shows field errors from a 400 response", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ errors: { fieldErrors: { newPassword: ["Too short"] } } }, 400)
			);
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "x", "x");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Too short")).toBeInTheDocument();
			});
		});

		it("shows 'Current password is incorrect.' on a 401 with 'Invalid credentials'", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ error: "Invalid credentials" }, 401)
			);
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("wrong-pw", "new-pw", "new-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Current password is incorrect.")).toBeInTheDocument();
			});
		});

		it("shows a session-expired message on a 401 without 'Invalid credentials'", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "new-pw", "new-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Session expired — please log in again.")).toBeInTheDocument();
			});
		});

		it("shows a rate-limit message on 429", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 429));
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "new-pw", "new-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Too many attempts. Please try again later.")).toBeInTheDocument();
			});
		});

		it("shows a generic error when fetch throws", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));
			render(<SettingsPage />);
			openSecurityTab();
			fillPasswordFields("current-pw", "new-pw", "new-pw");
			await act(async () => {
				fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
			});
			await waitFor(() => {
				expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
			});
		});
	});

	describe("NotificationsTab", () => {
		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({
				user: { email: "alice@example.com", approved: true, pubEditAlertsEnabled: true },
				isApproved: true,
				isAdmin: false,
			});
		});

		function openNotificationsTab() {
			fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
		}

		it("reflects the user's initial pubEditAlertsEnabled value", () => {
			render(<SettingsPage />);
			openNotificationsTab();
			expect(screen.getByLabelText("Edit to a pub I added")).toBeChecked();
		});

		it("toggling PATCHes /api/auth/me with the new value and dispatches authChanged", async () => {
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
			const dispatchSpy = vi.spyOn(window, "dispatchEvent");
			render(<SettingsPage />);
			openNotificationsTab();
			await act(async () => {
				fireEvent.click(screen.getByLabelText("Edit to a pub I added"));
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/auth/me",
				expect.objectContaining({
					method: "PATCH",
					body: JSON.stringify({ pubEditAlertsEnabled: false }),
				})
			);
			expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
		});

		it("reverts the toggle and shows an error on a 401 response", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
			render(<SettingsPage />);
			openNotificationsTab();
			await act(async () => {
				fireEvent.click(screen.getByLabelText("Edit to a pub I added"));
			});
			await waitFor(() => {
				expect(screen.getByText("Session expired — please log in again.")).toBeInTheDocument();
			});
			expect(screen.getByLabelText("Edit to a pub I added")).toBeChecked();
		});

		it("reverts the toggle and shows a generic error when fetch throws", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));
			render(<SettingsPage />);
			openNotificationsTab();
			await act(async () => {
				fireEvent.click(screen.getByLabelText("Edit to a pub I added"));
			});
			await waitFor(() => {
				expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
			});
			expect(screen.getByLabelText("Edit to a pub I added")).toBeChecked();
		});
	});

	describe("ApiPreferencesTab", () => {
		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({
				user: { email: "alice@example.com", approved: true, usageLimitAlertsEnabled: false },
				isApproved: true,
				isAdmin: false,
			});
		});

		function openApiPreferencesTab() {
			fireEvent.click(screen.getByRole("button", { name: "API preferences" }));
		}

		it("reflects the user's initial usageLimitAlertsEnabled value", () => {
			render(<SettingsPage />);
			openApiPreferencesTab();
			expect(screen.getByLabelText("Usage limit alerts")).not.toBeChecked();
		});

		it("toggling PATCHes /api/auth/me with the new value", async () => {
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
			render(<SettingsPage />);
			openApiPreferencesTab();
			await act(async () => {
				fireEvent.click(screen.getByLabelText("Usage limit alerts"));
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/auth/me",
				expect.objectContaining({
					method: "PATCH",
					body: JSON.stringify({ usageLimitAlertsEnabled: true }),
				})
			);
		});

		it("reverts the toggle on failure", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
			render(<SettingsPage />);
			openApiPreferencesTab();
			await act(async () => {
				fireEvent.click(screen.getByLabelText("Usage limit alerts"));
			});
			await waitFor(() => {
				expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
			});
			expect(screen.getByLabelText("Usage limit alerts")).not.toBeChecked();
		});
	});

	describe("AppearanceTab", () => {
		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({
				user: { email: "alice@example.com", approved: true },
				isApproved: true,
				isAdmin: false,
			});
		});

		function openAppearanceTab() {
			fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
		}

		it("marks the current theme option as pressed", () => {
			vi.mocked(useTheme).mockReturnValue({
				theme: "dark",
				setTheme: vi.fn(),
				toggleTheme: vi.fn(),
			});
			render(<SettingsPage />);
			openAppearanceTab();
			expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
			expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "false");
		});

		it("clicking a theme option calls setTheme", () => {
			const setTheme = vi.fn();
			vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme, toggleTheme: vi.fn() });
			render(<SettingsPage />);
			openAppearanceTab();
			fireEvent.click(screen.getByRole("button", { name: "Dark" }));
			expect(setTheme).toHaveBeenCalledWith("dark");
		});
	});
});
