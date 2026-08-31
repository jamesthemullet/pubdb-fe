import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocNav } from "./DocNav";

describe("DocNav", () => {
  it("renders all nav items with links to their section anchors", () => {
    render(<DocNav />);

    const navItems = [
      { label: "Quick start", href: "#quick-start" },
      { label: "Authentication", href: "#authentication" },
      { label: "Endpoints", href: "#endpoints" },
      { label: "Filtering & search", href: "#filtering" },
      { label: "Pagination", href: "#pagination" },
      { label: "Rate limits", href: "#rate-limits" },
      { label: "Errors", href: "#errors" },
    ];
    for (const { label, href } of navItems) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href
      );
    }
  });
});
