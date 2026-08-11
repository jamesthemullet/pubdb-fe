import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from "@/hooks/useTheme";
import Topbar from "./topbar";

describe("Topbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });
  });

  it("renders the 'What's new' link pointing to /changelog", () => {
    render(<Topbar />);
    const link = screen.getByRole("link", { name: /what's new/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/changelog");
  });

  it("shows 'Switch to dark mode' aria-label when the current theme is light", () => {
    render(<Topbar />);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("shows 'Switch to light mode' aria-label when the current theme is dark", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "dark",
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });
    render(<Topbar />);
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("calls toggleTheme when the theme toggle button is clicked", () => {
    const toggleTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme: vi.fn(), toggleTheme });
    render(<Topbar />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});
