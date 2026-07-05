import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Pub } from "@/types/pub";
import CompletenessCard from "./CompletenessCard";

const BASE_PUB: Pub = {
  id: "pub-1",
  name: "The Test Pub",
  city: "London",
  address: "1 Test St",
  postcode: "E1 1AA",
  country: "GB",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("CompletenessCard", () => {
  it("renders the completeness label and an accessible progress bar", () => {
    render(<CompletenessCard pub={BASE_PUB} />);
    expect(screen.getByText("Listing completeness")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(0);
  });

  it("shows missing field chips for an incomplete pub", () => {
    render(<CompletenessCard pub={BASE_PUB} />);
    expect(screen.getByText("Missing:")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders the improve button only when onEdit is provided", () => {
    const onEdit = vi.fn();
    const { rerender } = render(<CompletenessCard pub={BASE_PUB} />);
    expect(screen.queryByRole("button", { name: /improve/i })).toBeNull();
    rerender(<CompletenessCard pub={BASE_PUB} onEdit={onEdit} />);
    expect(screen.getByRole("button", { name: /improve/i })).toBeInTheDocument();
  });
});
