import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/hooks/useAuth";
import EditButton from "./EditButton";

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
		).toHaveAttribute("href", "/register");
	});

	it("shows the approval message when user is not approved", () => {
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
			screen.getByText("Your account is not approved for editing."),
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
});
