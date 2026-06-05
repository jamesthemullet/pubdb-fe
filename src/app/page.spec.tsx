import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./page";

vi.mock("./features/pricing/pricing", () => ({
  default: () => <div data-testid="pricing">Pricing</div>,
}));

vi.mock("./features/homepage/hero-code-block", () => ({
  default: () => <div data-testid="hero-code-block" />,
}));

describe("Home page", () => {
  it("renders the hero heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/the pub database/i);
  });

  it("renders the hero CTA buttons", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /get an api key/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse pubs/i })).toBeInTheDocument();
  });

  it("renders the early access banner", () => {
    render(<Home />);

    expect(screen.getByText(/early access/i)).toBeInTheDocument();
  });

  it("renders the contribute section", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /find your local/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add a missing pub/i })).toBeInTheDocument();
  });

  it("renders the pricing section", () => {
    render(<Home />);

    expect(screen.getByTestId("pricing")).toBeInTheDocument();
  });
});
