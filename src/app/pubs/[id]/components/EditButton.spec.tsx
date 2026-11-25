import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push }),
}));

import type { AuthUser } from "@/hooks/useAuth";
import EditButton from "./EditButton";

const adminUser: AuthUser = {
	email: "admin@example.com",
	approved: true,
	admin: true,
};

describe("EditButton (pub detail)", () => {
	it("shows a login link when user is null", () => {
		render(
			<EditButton
				pubName="The Crown"
				pubId="pub-1"
				user={null}
				onEdit={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("link", { name: "Log in to edit this pub" }),
		).toHaveAttribute("href", "/register?redirect=%2Fpubs%2Fpub-1");
	});

	it("shows the edit button for an unapproved user, deferring to the API to enforce quota", () => {
		const user: AuthUser = { email: "user@example.com", approved: false };
		render(
			<EditButton
				pubName="The Crown"
				pubId="pub-1"
				user={user}
				onEdit={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Edit this pub" }),
		).toBeInTheDocument();
	});

	it("shows the edit button but no delete button when the user is approved but not admin", () => {
		const user: AuthUser = {
			email: "user@example.com",
			approved: true,
			admin: false,
		};
		render(
			<EditButton
				pubName="The Crown"
				pubId="pub-1"
				user={user}
				onEdit={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Edit this pub" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Delete this pub" }),
		).not.toBeInTheDocument();
	});

	describe("handleDelete", () => {
		beforeEach(() => {
			push.mockClear();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("does not call the API when the confirm dialog is dismissed", () => {
			vi.spyOn(window, "confirm").mockReturnValue(false);
			const fetchSpy = vi.spyOn(globalThis, "fetch");

			render(
				<EditButton pubName="The Crown" pubId="pub-1" user={adminUser} onEdit={vi.fn()} />,
			);
			fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

			expect(fetchSpy).not.toHaveBeenCalled();
			expect(push).not.toHaveBeenCalled();
		});

		it("shows the API's error message and does not navigate on a non-ok response", async () => {
			vi.spyOn(window, "confirm").mockReturnValue(true);
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				new Response(JSON.stringify({ error: "Pub has pending edits" }), {
					status: 409,
				}),
			);

			render(
				<EditButton pubName="The Crown" pubId="pub-1" user={adminUser} onEdit={vi.fn()} />,
			);
			fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

			await waitFor(() => {
				expect(screen.getByText("Pub has pending edits")).toBeInTheDocument();
			});
			expect(push).not.toHaveBeenCalled();
		});

		it("falls back to a generic error message when the response body has no error field", async () => {
			vi.spyOn(window, "confirm").mockReturnValue(true);
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				new Response(JSON.stringify({}), { status: 500 }),
			);

			render(
				<EditButton pubName="The Crown" pubId="pub-1" user={adminUser} onEdit={vi.fn()} />,
			);
			fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

			await waitFor(() => {
				expect(screen.getByText("Failed to delete pub")).toBeInTheDocument();
			});
			expect(push).not.toHaveBeenCalled();
		});

		it("shows a success message and navigates to /pubs on a successful delete", async () => {
			vi.spyOn(window, "confirm").mockReturnValue(true);
			vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

			render(
				<EditButton pubName="The Crown" pubId="pub-1" user={adminUser} onEdit={vi.fn()} />,
			);
			fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

			await waitFor(() => {
				expect(screen.getByText("Pub deleted successfully")).toBeInTheDocument();
			});
			expect(push).toHaveBeenCalledWith("/pubs");
		});

		it("shows a network error message when the fetch throws", async () => {
			vi.spyOn(window, "confirm").mockReturnValue(true);
			vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

			render(
				<EditButton pubName="The Crown" pubId="pub-1" user={adminUser} onEdit={vi.fn()} />,
			);
			fireEvent.click(screen.getByRole("button", { name: "Delete this pub" }));

			await waitFor(() => {
				expect(screen.getByText("Network error")).toBeInTheDocument();
			});
			expect(push).not.toHaveBeenCalled();
		});
	});
});
