import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SunScheduleEntry } from "@/types/pub";
import SunScheduleEditor from "./SunScheduleEditor";

function renderEditor(value?: SunScheduleEntry[], onChange = vi.fn()) {
  render(<SunScheduleEditor value={value} onChange={onChange} />);
  return { onChange };
}

describe("SunScheduleEditor", () => {
  it("shows an empty state when there are no entries", () => {
    renderEditor([]);
    expect(screen.getByText("No sun schedule entries yet.")).toBeInTheDocument();
  });

  it("adds an entry defaulting to January when Add hour is clicked", () => {
    const { onChange } = renderEditor([]);
    fireEvent.click(screen.getByRole("button", { name: "Add hour" }));
    expect(onChange).toHaveBeenCalledWith([{ month: 1, time: "12:00" }]);
  });

  it("renders a month dropdown for every row", () => {
    renderEditor([{ time: "12:00", month: 3 }]);
    expect(screen.getByLabelText("Sun schedule entry 1 month")).toBeInTheDocument();
  });

  it("updates the month when the month dropdown changes", () => {
    const { onChange } = renderEditor([{ time: "12:00", month: 1 }]);
    fireEvent.change(screen.getByLabelText("Sun schedule entry 1 month"), {
      target: { value: "6" },
    });
    expect(onChange).toHaveBeenCalledWith([{ time: "12:00", month: 6 }]);
  });

  it("updates the hour when the hour dropdown changes", () => {
    const { onChange } = renderEditor([{ time: "12:00", month: 1 }]);
    fireEvent.change(screen.getByLabelText("Sun schedule entry 1 hour"), {
      target: { value: "14:00" },
    });
    expect(onChange).toHaveBeenCalledWith([{ time: "14:00", month: 1 }]);
  });

  it("clamps percentInSun between 0 and 100", () => {
    const { onChange } = renderEditor([{ time: "12:00" }]);
    fireEvent.change(screen.getByLabelText("Sun schedule entry 1 percent in sun"), {
      target: { value: "150" },
    });
    expect(onChange).toHaveBeenCalledWith([{ time: "12:00", percentInSun: 100 }]);
  });

  it("rounds seats to a non-negative integer", () => {
    const { onChange } = renderEditor([{ time: "12:00" }]);
    fireEvent.change(screen.getByLabelText("Sun schedule entry 1 seats"), {
      target: { value: "12.6" },
    });
    expect(onChange).toHaveBeenCalledWith([{ time: "12:00", seats: 13 }]);
  });

  it("removes an entry when Remove is clicked", () => {
    const { onChange } = renderEditor([
      { time: "12:00" },
      { time: "13:00" },
    ]);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(onChange).toHaveBeenCalledWith([{ time: "13:00" }]);
  });

  it("disables Add hour once the 288 entry limit is reached", () => {
    const entries = Array.from({ length: 288 }, (_, i) => ({
      time: `${String(i % 24).padStart(2, "0")}:00`,
      month: (i % 12) + 1,
    }));
    renderEditor(entries);
    expect(screen.getByRole("button", { name: "Add hour" })).toBeDisabled();
    expect(
      screen.getByText("Maximum of 288 entries reached.")
    ).toBeInTheDocument();
  }, 15000);
});
