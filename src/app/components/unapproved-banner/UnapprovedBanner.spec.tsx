import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UnapprovedBanner from "./UnapprovedBanner";

describe("UnapprovedBanner", () => {
  it("advises the free contribution limit and links to request approval by email", () => {
    render(<UnapprovedBanner email="alice@example.com" />);

    expect(screen.getByText(/up to 10 free contributions/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Chase approval by email" });
    expect(link).toHaveAttribute("href");
    expect(link.getAttribute("href")).toContain(
      encodeURIComponent("Account email: alice@example.com")
    );
  });
});
