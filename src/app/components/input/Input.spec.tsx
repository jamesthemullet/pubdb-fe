import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Input from "./Input";
import styles from "./Input.module.css";

describe("Input", () => {
  it("renders a text input with default full-width styling", () => {
    render(<Input aria-label="Name" defaultValue="The Harp" />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass(styles.input);
    expect(input).toHaveClass(styles.fullWidth);
    expect(input).not.toHaveClass(styles.toggle);
    expect(input).toHaveValue("The Harp");
  });

  it("forwards refs and calls onChange for text inputs", () => {
    const ref = createRef<HTMLInputElement>();
    const handleChange = vi.fn();

    render(
      <Input
        aria-label="City"
        defaultValue="London"
        onChange={handleChange}
        ref={ref}
      />
    );

    const input = screen.getByRole("textbox", { name: "City" });
    expect(ref.current).toBe(input);

    fireEvent.change(input, { target: { value: "Bristol" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("Bristol");
  });

  it("uses toggle styling for checkbox inputs and omits full-width class", () => {
    render(<Input aria-label="Dog friendly" type="checkbox" />);

    const input = screen.getByRole("checkbox", { name: "Dog friendly" });
    expect(input).toHaveClass(styles.input);
    expect(input).toHaveClass(styles.toggle);
    expect(input).not.toHaveClass(styles.fullWidth);
  });

  it("supports opting out of full width and merging custom classes", () => {
    render(
      <Input aria-label="Postcode" fullWidth={false} className="custom-class" />
    );

    const input = screen.getByRole("textbox", { name: "Postcode" });
    expect(input).toHaveClass(styles.input);
    expect(input).not.toHaveClass(styles.fullWidth);
    expect(input).toHaveClass("custom-class");
  });
});