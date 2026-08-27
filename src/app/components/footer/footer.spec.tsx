import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Footer from "./footer";

describe("Footer", () => {
  it("renders the copyright notice with the current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    expect(screen.getByText(/Pub DB/)).toBeInTheDocument();
  });

  it("renders a Terms link pointing to /terms", () => {
    render(<Footer />);
    const terms = screen.getByRole("link", { name: "Terms" });
    expect(terms).toHaveAttribute("href", "/terms");
  });

  it("renders a Privacy link pointing to /privacy", () => {
    render(<Footer />);
    const privacy = screen.getByRole("link", { name: "Privacy" });
    expect(privacy).toHaveAttribute("href", "/privacy");
  });

  it("renders a footer landmark element", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders the navigation landmark with an accessible label", () => {
    render(<Footer />);
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
  });
});
