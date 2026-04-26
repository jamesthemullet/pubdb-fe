import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BeerGarden } from "@/types/pub";
import BeerGardenEditCard from "./BeerGardenEditCard";

vi.mock("@/app/features/opening-hours/opening-hours-editor", () => ({
  default: () => <div data-testid="opening-hours-editor" />,
}));

const SAMPLE_GARDEN: BeerGarden = {
  id: "garden-1",
  name: "Back Garden",
  description: "A lovely space",
  seatingCapacity: 40,
  sunExposure: "PARTIAL_SUN",
  isCovered: false,
  isHeated: true,
  isFamilyFriendly: true,
  petFriendly: false,
};

function renderCard(
  overrides: Partial<BeerGarden> = {},
  index = 0,
  onUpdate = vi.fn(),
  onRemove = vi.fn(),
) {
  const garden = { ...SAMPLE_GARDEN, ...overrides };
  render(
    <BeerGardenEditCard
      garden={garden}
      index={index}
      onUpdate={onUpdate}
      onRemove={onRemove}
    />,
  );
  return { garden, onUpdate, onRemove };
}

describe("BeerGardenEditCard", () => {
  describe("header", () => {
    it("displays the 1-based garden number", () => {
      renderCard({}, 0);
      expect(screen.getByText("Garden 1")).toBeInTheDocument();
    });

    it("increments the garden number by index", () => {
      renderCard({}, 2);
      expect(screen.getByText("Garden 3")).toBeInTheDocument();
    });

    it("renders the Remove button", () => {
      renderCard();
      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    it("calls onRemove with the correct index when Remove is clicked", () => {
      const onRemove = vi.fn();
      renderCard({}, 1, vi.fn(), onRemove);
      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      expect(onRemove).toHaveBeenCalledWith(1);
    });
  });

  describe("name field", () => {
    it("renders the name input with the current value", () => {
      renderCard();
      expect(screen.getByLabelText(/Name:/)).toHaveValue("Back Garden");
    });

    it("calls onUpdate with the new name when the name input changes", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Name:/), {
        target: { value: "Front Terrace" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { name: "Front Terrace" });
    });
  });

  describe("description field", () => {
    it("renders the description textarea with the current value", () => {
      renderCard();
      expect(screen.getByLabelText(/Description:/)).toHaveValue("A lovely space");
    });

    it("renders an empty description textarea when description is undefined", () => {
      renderCard({ description: undefined });
      expect(screen.getByLabelText(/Description:/)).toHaveValue("");
    });

    it("calls onUpdate with new description on change", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Description:/), {
        target: { value: "Updated description" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { description: "Updated description" });
    });

    it("calls onUpdate with undefined description when textarea is cleared", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Description:/), {
        target: { value: "" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { description: undefined });
    });
  });

  describe("seating capacity field", () => {
    it("renders the seating capacity input with the current value", () => {
      renderCard();
      expect(screen.getByLabelText(/Seating capacity:/)).toHaveValue(40);
    });

    it("renders an empty seating capacity input when seatingCapacity is undefined", () => {
      renderCard({ seatingCapacity: undefined });
      expect(screen.getByLabelText(/Seating capacity:/)).toHaveValue(null);
    });

    it("calls onUpdate with a parsed integer when seating capacity changes", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Seating capacity:/), {
        target: { value: "25" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { seatingCapacity: 25 });
    });

    it("calls onUpdate with undefined when seating capacity is cleared", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Seating capacity:/), {
        target: { value: "" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { seatingCapacity: undefined });
    });
  });

  describe("sun exposure dropdown", () => {
    it("renders all sun exposure options", () => {
      renderCard();
      expect(screen.getByRole("option", { name: "Full sun" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Partial sun" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Shaded" })).toBeInTheDocument();
    });

    it("shows the current sun exposure as selected", () => {
      renderCard({ sunExposure: "FULL_SUN" });
      expect(screen.getByLabelText(/Sun exposure:/)).toHaveValue("FULL_SUN");
    });

    it("calls onUpdate with the new sun exposure when selection changes", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Sun exposure:/), {
        target: { value: "SHADED" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { sunExposure: "SHADED" });
    });

    it("calls onUpdate with undefined when the blank option is selected", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Sun exposure:/), {
        target: { value: "" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, { sunExposure: undefined });
    });
  });

  describe("checkbox fields", () => {
    it("reflects isCovered state on the Covered checkbox", () => {
      renderCard({ isCovered: true });
      expect(screen.getByLabelText("Covered")).toBeChecked();
    });

    it("reflects isHeated state on the Heated checkbox", () => {
      renderCard({ isHeated: true });
      expect(screen.getByLabelText("Heated")).toBeChecked();
    });

    it("reflects isFamilyFriendly state on the Family friendly checkbox", () => {
      renderCard({ isFamilyFriendly: false });
      expect(screen.getByLabelText("Family friendly")).not.toBeChecked();
    });

    it("reflects petFriendly state on the Pet friendly checkbox", () => {
      renderCard({ petFriendly: false });
      expect(screen.getByLabelText("Pet friendly")).not.toBeChecked();
    });

    it("calls onUpdate with isCovered when the Covered checkbox is toggled", () => {
      const onUpdate = vi.fn();
      renderCard({ isCovered: false }, 0, onUpdate);
      fireEvent.click(screen.getByLabelText("Covered"));
      expect(onUpdate).toHaveBeenCalledWith(0, { isCovered: true });
    });

    it("calls onUpdate with isHeated when the Heated checkbox is toggled", () => {
      const onUpdate = vi.fn();
      renderCard({ isHeated: false }, 0, onUpdate);
      fireEvent.click(screen.getByLabelText("Heated"));
      expect(onUpdate).toHaveBeenCalledWith(0, { isHeated: true });
    });

    it("calls onUpdate with isFamilyFriendly when Family friendly is toggled", () => {
      const onUpdate = vi.fn();
      renderCard({ isFamilyFriendly: true }, 0, onUpdate);
      fireEvent.click(screen.getByLabelText("Family friendly"));
      expect(onUpdate).toHaveBeenCalledWith(0, { isFamilyFriendly: false });
    });

    it("calls onUpdate with petFriendly when Pet friendly is toggled", () => {
      const onUpdate = vi.fn();
      renderCard({ petFriendly: false }, 0, onUpdate);
      fireEvent.click(screen.getByLabelText("Pet friendly"));
      expect(onUpdate).toHaveBeenCalledWith(0, { petFriendly: true });
    });
  });

  describe("image URL field", () => {
    it("renders an empty image URL input when imageUrl is undefined", () => {
      renderCard({ imageUrl: undefined });
      expect(screen.getByLabelText(/Image URL:/)).toHaveValue("");
    });

    it("renders the image URL input with the current value", () => {
      renderCard({ imageUrl: "https://example.com/garden.jpg" });
      expect(screen.getByLabelText(/Image URL:/)).toHaveValue(
        "https://example.com/garden.jpg",
      );
    });

    it("calls onUpdate with new imageUrl on change", () => {
      const onUpdate = vi.fn();
      renderCard({}, 0, onUpdate);
      fireEvent.change(screen.getByLabelText(/Image URL:/), {
        target: { value: "https://example.com/new.jpg" },
      });
      expect(onUpdate).toHaveBeenCalledWith(0, {
        imageUrl: "https://example.com/new.jpg",
      });
    });
  });

  describe("opening hours", () => {
    it("renders the opening hours editor", () => {
      renderCard();
      expect(screen.getByTestId("opening-hours-editor")).toBeInTheDocument();
    });
  });
});
