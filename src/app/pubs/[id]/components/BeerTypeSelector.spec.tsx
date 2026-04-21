import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BeerType } from "@/types/pub";
import BeerTypeSelector from "./BeerTypeSelector";

const BEER_TYPES: BeerType[] = [
  { id: "bt1", name: "Ale", colour: "amber" },
  { id: "bt2", name: "Stout", colour: null },
  { id: "bt3", name: "Lager" },
];

function renderSelector(
  overrides: Partial<React.ComponentProps<typeof BeerTypeSelector>> = {}
) {
  const props = {
    selectedIds: [],
    options: BEER_TYPES,
    loading: false,
    error: null,
    onToggle: vi.fn(),
    ...overrides,
  };
  render(<BeerTypeSelector {...props} />);
  return props;
}

describe("BeerTypeSelector", () => {
  describe("loading state", () => {
    it("shows loading text when loading is true", () => {
      renderSelector({ loading: true, options: [] });
      expect(screen.getByText("Loading beer types…")).toBeInTheDocument();
    });

    it("does not render checkboxes while loading", () => {
      renderSelector({ loading: true, options: BEER_TYPES });
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("empty / error state", () => {
    it('shows "No beer types available." when options are empty and there is no error', () => {
      renderSelector({ options: [] });
      expect(screen.getByText("No beer types available.")).toBeInTheDocument();
    });

    it("shows the error message when options are empty and error is set", () => {
      renderSelector({ options: [], error: "Failed to load beer types" });
      expect(screen.getByText("Failed to load beer types")).toBeInTheDocument();
    });

    it("does not show checkboxes when options are empty", () => {
      renderSelector({ options: [] });
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("options rendering", () => {
    it("renders a checkbox for each beer type", () => {
      renderSelector();
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(BEER_TYPES.length);
    });

    it("renders beer type names as labels", () => {
      renderSelector();
      expect(screen.getByLabelText(/Ale/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stout/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lager/)).toBeInTheDocument();
    });

    it("includes the colour in the label when it is set", () => {
      renderSelector();
      expect(screen.getByLabelText("Ale (amber)")).toBeInTheDocument();
    });

    it("does not append colour when colour is null", () => {
      renderSelector();
      expect(screen.getByLabelText("Stout")).toBeInTheDocument();
    });

    it("does not append colour when colour is absent", () => {
      renderSelector();
      expect(screen.getByLabelText("Lager")).toBeInTheDocument();
    });
  });

  describe("checked state", () => {
    it("checks the checkbox whose id is in selectedIds", () => {
      renderSelector({ selectedIds: ["bt1"] });
      expect(screen.getByLabelText(/Ale/)).toBeChecked();
    });

    it("leaves unchecked the checkboxes whose ids are not in selectedIds", () => {
      renderSelector({ selectedIds: ["bt1"] });
      expect(screen.getByLabelText(/Stout/)).not.toBeChecked();
      expect(screen.getByLabelText(/Lager/)).not.toBeChecked();
    });

    it("checks all checkboxes when all ids are selected", () => {
      renderSelector({ selectedIds: ["bt1", "bt2", "bt3"] });
      screen.getAllByRole("checkbox").forEach((cb) => {
        expect(cb).toBeChecked();
      });
    });
  });

  describe("toggle interaction", () => {
    it("calls onToggle with the beer type id when a checkbox is clicked", () => {
      const { onToggle } = renderSelector({ selectedIds: [] });
      fireEvent.click(screen.getByLabelText(/Ale/));
      expect(onToggle).toHaveBeenCalledWith("bt1");
    });

    it("calls onToggle with the correct id when a checked checkbox is clicked", () => {
      const { onToggle } = renderSelector({ selectedIds: ["bt2"] });
      fireEvent.click(screen.getByLabelText(/Stout/));
      expect(onToggle).toHaveBeenCalledWith("bt2");
    });

    it("calls onToggle once per click", () => {
      const { onToggle } = renderSelector();
      fireEvent.click(screen.getByLabelText(/Ale/));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("section label", () => {
    it('renders the "Beer Types:" label', () => {
      renderSelector();
      expect(screen.getByText("Beer Types:")).toBeInTheDocument();
    });
  });
});
