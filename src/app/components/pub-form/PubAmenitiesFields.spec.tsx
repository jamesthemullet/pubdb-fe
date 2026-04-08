import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";

import PubAmenitiesFields from "./PubAmenitiesFields";

describe("PubAmenitiesFields", () => {
  it("renders a checkbox for every amenity field", () => {
    render(
      <PubAmenitiesFields values={{}} onChange={vi.fn()} />
    );

    for (const field of PUB_AMENITY_FIELDS) {
      expect(screen.getByRole("checkbox", { name: field.label })).toBeInTheDocument();
    }
  });

  it("reflects checked state from values prop", () => {
    render(
      <PubAmenitiesFields
        values={{ hasFood: true, isDogFriendly: false }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Food available" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Dog friendly" })).not.toBeChecked();
  });

  it("defaults unchecked when a key is absent from values", () => {
    render(
      <PubAmenitiesFields values={{}} onChange={vi.fn()} />
    );

    for (const field of PUB_AMENITY_FIELDS) {
      expect(screen.getByRole("checkbox", { name: field.label })).not.toBeChecked();
    }
  });

  it("calls onChange with the correct key and checked value when toggled", () => {
    const handleChange = vi.fn();

    render(
      <PubAmenitiesFields values={{}} onChange={handleChange} />
    );

    const checkbox = screen.getByRole("checkbox", { name: "Beer garden" });
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("hasBeerGarden", true);
  });

  it("uses the idPrefix prop to build element ids", () => {
    render(
      <PubAmenitiesFields
        values={{}}
        onChange={vi.fn()}
        idPrefix="edit"
      />
    );

    const firstField = PUB_AMENITY_FIELDS[0];
    const checkbox = screen.getByRole("checkbox", { name: firstField.label });
    expect(checkbox).toHaveAttribute("id", `edit-${firstField.key}`);
  });
});
