import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocNav } from "./DocNav";

describe("DocNav", () => {
  it("renders all nav items and marks the clicked item as active via aria-current", () => {
    render(<DocNav />);

    // All nav items are rendered
    const navItems = [
      "Quick start",
      "Authentication",
      "Endpoints",
      "Filtering & search",
      "Pagination",
      "Rate limits",
      "Errors",
    ];
    for (const label of navItems) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }

    // Quick start is active by default
    expect(screen.getByRole("link", { name: "Quick start" })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(
      screen.getByRole("link", { name: "Authentication" })
    ).not.toHaveAttribute("aria-current");

    // Clicking Authentication makes it active
    fireEvent.click(screen.getByRole("link", { name: "Authentication" }));

    expect(
      screen.getByRole("link", { name: "Authentication" })
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("link", { name: "Quick start" })
    ).not.toHaveAttribute("aria-current");
  });
});
