import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";

vi.mock("../features/dashboard/dashboard", () => ({
	default: () => <div data-testid="dashboard" />,
}));

describe("ProfilePage", () => {
	it("renders the Dashboard component", () => {
		render(<ProfilePage />);
		expect(screen.getByTestId("dashboard")).toBeInTheDocument();
	});
});
