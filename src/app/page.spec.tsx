import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./page";

vi.mock("./features/pricing/pricing", () => ({
  default: () => <div data-testid="pricing">Pricing</div>,
}));

describe("Home page", () => {
  it("renders the heading and welcome copy", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Pub DB", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/welcome to pub db/i)).toBeInTheDocument();
  });

  it("renders the pricing section", () => {
    render(<Home />);

    expect(screen.getByTestId("pricing")).toBeInTheDocument();
  });
});
