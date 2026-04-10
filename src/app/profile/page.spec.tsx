import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";

vi.mock("../features/dashboard/dashboard", () => ({
	default: () => <div data-testid="dashboard" />,
}));

describe("ProfilePage", () => {
	it("renders the Profile heading", () => {
		render(<ProfilePage />);

		expect(
			screen.getByRole("heading", { name: "Profile" }),
		).toBeInTheDocument();
	});

	it("renders the account description text", () => {
		render(<ProfilePage />);

		expect(
			screen.getByText("Manage your API access and account details."),
		).toBeInTheDocument();
	});

	it("renders the Dashboard component", () => {
		render(<ProfilePage />);

		expect(screen.getByTestId("dashboard")).toBeInTheDocument();
	});
});
