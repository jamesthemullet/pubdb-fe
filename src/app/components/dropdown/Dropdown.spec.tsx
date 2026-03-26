import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Dropdown from "./Dropdown";
import styles from "./Dropdown.module.css";

describe("Dropdown", () => {
  it("renders a select with default full-width styling", () => {
    render(
      <Dropdown aria-label="Country" defaultValue="gb">
        <option value="">Select a country</option>
        <option value="gb">United Kingdom</option>
      </Dropdown>
    );

    const dropdown = screen.getByRole("combobox", { name: "Country" });
    expect(dropdown).toHaveClass(styles.dropdown);
    expect(dropdown).toHaveClass(styles.fullWidth);
    expect(dropdown).toHaveValue("gb");
  });

  it("supports opting out of full width and merges custom classes", () => {
    render(
      <Dropdown aria-label="City" fullWidth={false} className="custom-class">
        <option value="london">London</option>
      </Dropdown>
    );

    const dropdown = screen.getByRole("combobox", { name: "City" });
    expect(dropdown).toHaveClass(styles.dropdown);
    expect(dropdown).not.toHaveClass(styles.fullWidth);
    expect(dropdown).toHaveClass("custom-class");
  });

  it("forwards refs and calls onChange", () => {
    const ref = createRef<HTMLSelectElement>();
    const handleChange = vi.fn();

    render(
      <Dropdown
        aria-label="Region"
        defaultValue="north"
        onChange={handleChange}
        ref={ref}
      >
        <option value="north">North</option>
        <option value="south">South</option>
      </Dropdown>
    );

    const dropdown = screen.getByRole("combobox", { name: "Region" });
    expect(ref.current).toBe(dropdown);

    fireEvent.change(dropdown, { target: { value: "south" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(dropdown).toHaveValue("south");
  });
});