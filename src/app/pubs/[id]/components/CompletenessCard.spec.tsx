import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import type { Pub } from "@/types/pub";
import CompletenessCard from "./CompletenessCard";

const MINIMAL_PUB: Pub = {
  id: "1",
  name: "The Test Pub",
  city: "London",
  address: "1 Test St",
  postcode: "E1 1AA",
  country: "GB",
  createdAt: "2024-01-01T00:00:00Z",
};

const allAmenities = Object.fromEntries(
  PUB_AMENITY_FIELDS.map(({ key }) => [key, true])
) as Partial<Pub>;

const COMPLETE_PUB: Pub = {
  ...MINIMAL_PUB,
  ...allAmenities,
  description: "A great pub",
  imageUrl: "https://example.com/img.jpg",
  openingHours: { monday: { open: "12:00", close: "23:00" } },
  beerTypes: [{ id: "1", name: "IPA" }],
  website: "https://testpub.com",
  phone: "01234 567890",
  beerGardens: [{ name: "Main garden" }],
};

describe("CompletenessCard", () => {
  it("renders a progressbar with the completeness score", () => {
    render(<CompletenessCard pub={MINIMAL_PUB} />);
    const bar = screen.getByRole("progressbar");
    const score = Number(bar.getAttribute("aria-valuenow"));
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("displays the numeric score as a percentage label", () => {
    render(<CompletenessCard pub={MINIMAL_PUB} />);
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it("renders missing field chips for an incomplete pub", () => {
    render(<CompletenessCard pub={MINIMAL_PUB} />);
    expect(screen.getByText("Missing:")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("does not render missing fields section for a complete pub", () => {
    render(<CompletenessCard pub={COMPLETE_PUB} />);
    expect(screen.queryByText("Missing:")).not.toBeInTheDocument();
  });

  it("renders the improve button only when onEdit is provided", () => {
    const { rerender } = render(<CompletenessCard pub={MINIMAL_PUB} />);
    expect(screen.queryByRole("button", { name: /improve/i })).not.toBeInTheDocument();

    const onEdit = vi.fn();
    rerender(<CompletenessCard pub={MINIMAL_PUB} onEdit={onEdit} />);
    expect(screen.getByRole("button", { name: /improve/i })).toBeInTheDocument();
  });

  it("calls onEdit when the improve button is clicked", () => {
    const onEdit = vi.fn();
    render(<CompletenessCard pub={MINIMAL_PUB} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: /improve/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
