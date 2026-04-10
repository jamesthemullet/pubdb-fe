import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StyleGuidePage from "./page";

describe("StyleGuidePage", () => {
	it("renders the style guide heading", () => {
		render(<StyleGuidePage />);

		expect(
			screen.getByRole("heading", { name: "Warm, pub-inspired color system" }),
		).toBeInTheDocument();
	});

	it("renders the Palette section", () => {
		render(<StyleGuidePage />);

		expect(
			screen.getByRole("heading", { name: "Palette" }),
		).toBeInTheDocument();
	});

	it("renders colour swatches for all palette entries", () => {
		render(<StyleGuidePage />);

		expect(screen.getByText("Background")).toBeInTheDocument();
		expect(screen.getByText("Brand")).toBeInTheDocument();
		expect(screen.getByText("Accent")).toBeInTheDocument();
		expect(screen.getByText("Border")).toBeInTheDocument();
	});

	it("renders the Sample UI preview card", () => {
		render(<StyleGuidePage />);

		expect(
			screen.getByRole("heading", { name: "Sample UI" }),
		).toBeInTheDocument();
	});

	it("renders primary and secondary action buttons in the preview", () => {
		render(<StyleGuidePage />);

		expect(
			screen.getByRole("button", { name: "Primary Action" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Secondary Action" }),
		).toBeInTheDocument();
	});
});
