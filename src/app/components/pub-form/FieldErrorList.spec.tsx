import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FieldErrorList from "./FieldErrorList";

describe("FieldErrorList", () => {
  it("renders nothing when errors is undefined", () => {
    const { container } = render(
      <FieldErrorList idPrefix="name" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when errors is an empty array", () => {
    const { container } = render(
      <FieldErrorList errors={[]} idPrefix="name" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single error message", () => {
    render(
      <FieldErrorList errors={["Name is required"]} idPrefix="name" />
    );

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("renders multiple error messages", () => {
    render(
      <FieldErrorList
        errors={["Too short", "Invalid characters"]}
        idPrefix="city"
      />
    );

    expect(screen.getByText("Too short")).toBeInTheDocument();
    expect(screen.getByText("Invalid characters")).toBeInTheDocument();
  });

  it("applies the className to each error element", () => {
    render(
      <FieldErrorList
        errors={["Required"]}
        className="error-text"
        idPrefix="postcode"
      />
    );

    expect(screen.getByText("Required")).toHaveClass("error-text");
  });
});
