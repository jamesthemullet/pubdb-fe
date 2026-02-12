import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Typography from "./typography";
import styles from "./typography.module.css";

describe("Typography", () => {
  it("defaults to a paragraph with bodyMedium styling", () => {
    render(<Typography text="Body copy" />);

    const element = screen.getByText("Body copy");
    expect(element.tagName).toBe("P");
    expect(element).toHaveClass(styles.bodyMedium);
  });

  it("renders the correct element and variant", () => {
    render(
      <Typography variant="headingSmall" as="h3">
        Section title
      </Typography>
    );

    const element = screen.getByText("Section title");
    expect(element.tagName).toBe("H3");
    expect(element).toHaveClass(styles.headingSmall);
  });

  it("merges custom class names", () => {
    render(
      <Typography className="custom-class" text="With class" />
    );

    const element = screen.getByText("With class");
    expect(element).toHaveClass(styles.bodyMedium);
    expect(element).toHaveClass("custom-class");
  });
});
