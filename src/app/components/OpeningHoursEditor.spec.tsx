import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OpeningHoursEditor from "./OpeningHoursEditor";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

describe("OpeningHoursEditor", () => {
  it("renders a row for every day of the week", () => {
    render(<OpeningHoursEditor onChange={vi.fn()} />);

    for (const day of DAYS) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it("renders 14 time inputs and 7 closed checkboxes", () => {
    const { container } = render(<OpeningHoursEditor onChange={vi.fn()} />);

    const timeInputs = container.querySelectorAll('input[type="time"]');
    expect(timeInputs).toHaveLength(14);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(7);
  });

  it("initialises time inputs with values from the value prop", () => {
    const { container } = render(
      <OpeningHoursEditor
        value={{ Monday: { open: "09:00", close: "23:00", closed: false } }}
        onChange={vi.fn()}
      />
    );

    const timeInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="time"]')
    );

    const mondayOpen = timeInputs.find((el) => el.value === "09:00");
    const mondayClose = timeInputs.find((el) => el.value === "23:00");

    expect(mondayOpen).toBeDefined();
    expect(mondayClose).toBeDefined();
  });

  it("calls onChange when an open time changes", () => {
    const handleChange = vi.fn();
    const { container } = render(<OpeningHoursEditor onChange={handleChange} />);

    const [firstTimeInput] = container.querySelectorAll<HTMLInputElement>(
      'input[type="time"]'
    );

    fireEvent.change(firstTimeInput, { target: { value: "10:00" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updated = handleChange.mock.calls[0][0];
    expect(updated.Monday.open).toBe("10:00");
  });

  it("disables time inputs and clears times when closed is checked", () => {
    const handleChange = vi.fn();
    const { container } = render(<OpeningHoursEditor onChange={handleChange} />);

    const [mondayClosed] = screen.getAllByRole("checkbox");
    fireEvent.click(mondayClosed);

    expect(mondayClosed).toBeChecked();

    const updated = handleChange.mock.calls[0][0];
    expect(updated.Monday.closed).toBe(true);
    expect(updated.Monday.open).toBe("");
    expect(updated.Monday.close).toBe("");

    const [openInput] = container.querySelectorAll<HTMLInputElement>(
      'input[type="time"]'
    );
    expect(openInput).toBeDisabled();
  });
});
