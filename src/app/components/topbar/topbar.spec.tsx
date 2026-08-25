import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Topbar from "./topbar";

describe("Topbar", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders a 'What's new' link pointing to /changelog", () => {
    render(<Topbar />);
    const link = screen.getByRole("link", { name: /what.s new/i });
    expect(link).toHaveAttribute("href", "/changelog");
  });

  it("renders a header landmark element", () => {
    render(<Topbar />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the theme toggle button with an accessible label", () => {
    render(<Topbar />);
    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
  });

  it("shows 'Switch to dark mode' label when the current theme is light", () => {
    localStorage.setItem("theme", "light");
    render(<Topbar />);
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" })
    ).toBeInTheDocument();
  });

  it("shows 'Switch to light mode' label when the current theme is dark", () => {
    localStorage.setItem("theme", "dark");
    render(<Topbar />);
    const button = screen.getByRole("button", { name: "Switch to light mode" });
    expect(button).toBeInTheDocument();
  });

  it("toggles the theme when the button is clicked", () => {
    render(<Topbar />);
    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    fireEvent.click(button);
    expect(
      screen.getByRole("button", { name: "Switch to light mode" })
    ).toBeInTheDocument();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
