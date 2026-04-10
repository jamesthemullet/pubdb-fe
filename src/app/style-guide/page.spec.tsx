import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StyleGuidePage from "./page";

describe("StyleGuidePage", () => {
	it("renders the headings, palette swatches, and Sample UI buttons", () => {
		render(<StyleGuidePage />);

		expect(
			screen.getByRole("heading", { name: "Warm, pub-inspired color system" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Palette" }),
		).toBeInTheDocument();
		expect(screen.getByText("Background")).toBeInTheDocument();
		expect(screen.getByText("Brand")).toBeInTheDocument();
		expect(screen.getByText("Accent")).toBeInTheDocument();
		expect(screen.getByText("Border")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Sample UI" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Primary Action" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Secondary Action" }),
		).toBeInTheDocument();
	});
});
