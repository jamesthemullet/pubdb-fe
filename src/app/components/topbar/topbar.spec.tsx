import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from "@/hooks/useTheme";
import Topbar from "./topbar";

describe("Topbar", () => {
  it("renders the What's new link pointing to /changelog", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
    });

    render(<Topbar />);

    const link = screen.getByRole("link", { name: /what's new/i });
    expect(link).toHaveAttribute("href", "/changelog");
  });

  it("flips the theme toggle aria-label based on current theme", () => {
    const toggleTheme = vi.fn();

    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      toggleTheme,
      setTheme: vi.fn(),
    });

    const { rerender } = render(<Topbar />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to dark mode"
    );

    vi.mocked(useTheme).mockReturnValue({
      theme: "dark",
      toggleTheme,
      setTheme: vi.fn(),
    });

    rerender(<Topbar />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to light mode"
    );
  });
});
