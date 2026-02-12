import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Heading from "./heading";

describe("Heading", () => {
  it("renders a level 1 heading with the provided text", () => {
    render(<Heading text="Profile" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Profile" })
    ).toBeInTheDocument();
  });
});
