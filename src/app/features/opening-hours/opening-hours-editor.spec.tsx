import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OpeningHoursEditor from "./opening-hours-editor";

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

  it("renders 16 time inputs (7 days × 2 + 2 bulk inputs) and 7 closed checkboxes", () => {
    const { container } = render(<OpeningHoursEditor onChange={vi.fn()} />);

    const timeInputs = container.querySelectorAll('input[type="time"]');
    expect(timeInputs).toHaveLength(16); // 7 days × 2 + 2 bulk inputs

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
    const { container } = render(
      <OpeningHoursEditor onChange={handleChange} />
    );

    const timeInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="time"]');
    // First 2 inputs are the bulk row; Monday open is index 2
    const mondayOpenInput = timeInputs[2];

    fireEvent.change(mondayOpenInput, { target: { value: "10:00" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updated = handleChange.mock.calls[0][0];
    expect(updated.Monday.open).toBe("10:00");
  });

  it("disables time inputs and clears times when closed is checked", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <OpeningHoursEditor onChange={handleChange} />
    );

    const [mondayClosed] = screen.getAllByRole("checkbox");
    fireEvent.click(mondayClosed);

    expect(mondayClosed).toBeChecked();

    const updated = handleChange.mock.calls[0][0];
    expect(updated.Monday.closed).toBe(true);
    expect(updated.Monday.open).toBe("");
    expect(updated.Monday.close).toBe("");

    const timeInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="time"]');
    // First 2 inputs are the bulk row; Monday open is index 2
    const mondayOpenInput = timeInputs[2];
    expect(mondayOpenInput).toBeDisabled();
  });

  it("applies bulk open/close times to all non-closed days when Apply is clicked", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <OpeningHoursEditor onChange={handleChange} />
    );

    const timeInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="time"]');
    // Bulk row: index 0 = open, index 1 = close
    fireEvent.change(timeInputs[0], { target: { value: "09:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "23:00" } });

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    const updated =
      handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    for (const day of DAYS) {
      expect(updated[day].open).toBe("09:00");
      expect(updated[day].close).toBe("23:00");
    }
  });

  it("does not overwrite closed days when Apply to all is used", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <OpeningHoursEditor onChange={handleChange} />
    );

    // Mark Monday as closed
    const [mondayClosed] = screen.getAllByRole("checkbox");
    fireEvent.click(mondayClosed);

    handleChange.mockClear();

    const timeInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="time"]');
    fireEvent.change(timeInputs[0], { target: { value: "10:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "22:00" } });

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    const updated =
      handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    // Monday was closed — its times must remain untouched
    expect(updated.Monday.closed).toBe(true);
    expect(updated.Monday.open).toBe("");
    expect(updated.Monday.close).toBe("");
    // Other days receive the bulk times
    expect(updated.Tuesday.open).toBe("10:00");
    expect(updated.Tuesday.close).toBe("22:00");
  });

  it("updates time inputs when the value prop changes", () => {
    const handleChange = vi.fn();
    const { rerender, container } = render(
      <OpeningHoursEditor onChange={handleChange} />
    );

    rerender(
      <OpeningHoursEditor
        value={{ Monday: { open: "11:00", close: "22:00", closed: false } }}
        onChange={handleChange}
      />
    );

    const timeInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="time"]')
    );
    const mondayOpen = timeInputs.find((el) => el.value === "11:00");
    const mondayClose = timeInputs.find((el) => el.value === "22:00");

    expect(mondayOpen).toBeDefined();
    expect(mondayClose).toBeDefined();
  });
});
