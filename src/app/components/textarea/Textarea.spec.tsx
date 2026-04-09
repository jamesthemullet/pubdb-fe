import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import Textarea from "./Textarea";
import styles from "./Textarea.module.css";

describe("Textarea", () => {
  it("renders a textarea with default full-width styling", () => {
    render(<Textarea aria-label="Description" defaultValue="Classic pub" />);

    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveClass(styles.textarea);
    expect(textarea).toHaveClass(styles.fullWidth);
    expect(textarea).toHaveValue("Classic pub");
  });

  it("supports opting out of full width and merging custom classes", () => {
    render(
      <Textarea aria-label="Notes" fullWidth={false} className="custom-class" />
    );

    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea).toHaveClass(styles.textarea);
    expect(textarea).not.toHaveClass(styles.fullWidth);
    expect(textarea).toHaveClass("custom-class");
  });

  it("forwards refs and calls onChange", () => {
    const ref = createRef<HTMLTextAreaElement>();
    const handleChange = vi.fn();

    render(
      <Textarea
        aria-label="Review"
        defaultValue="Good atmosphere"
        onChange={handleChange}
        ref={ref}
      />
    );

    const textarea = screen.getByRole("textbox", { name: "Review" });
    expect(ref.current).toBe(textarea);

    fireEvent.change(textarea, { target: { value: "Great atmosphere" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue("Great atmosphere");
  });
});