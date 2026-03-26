import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Button from "./button";
import styles from "./button.module.css";

describe("Button", () => {
  it("renders with default type and default styling classes", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(styles.button);
    expect(button).toHaveClass(styles.primary);
    expect(button).toHaveClass(styles.md);
  });

  it("applies variant, size, fullWidth, and custom classes", () => {
    render(
      <Button variant="red" size="lg" fullWidth className="custom-class">
        Delete
      </Button>
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass(styles.button);
    expect(button).toHaveClass(styles.red);
    expect(button).toHaveClass(styles.lg);
    expect(button).toHaveClass(styles.fullWidth);
    expect(button).toHaveClass("custom-class");
  });

  it("passes through native button props and handles clicks", () => {
    const handleClick = vi.fn();

    render(
      <Button type="submit" disabled onClick={handleClick}>
        Submit
      </Button>
    );

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});