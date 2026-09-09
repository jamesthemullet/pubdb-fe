import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockAccented = vi.hoisted(() => vi.fn());
vi.mock("accented", () => ({ accented: mockAccented }));

import AccentedInit from "./AccentedInit";

describe("AccentedInit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("calls accented() when NEXT_PUBLIC_ACCENTED is 'true'", async () => {
    vi.stubEnv("NEXT_PUBLIC_ACCENTED", "true");

    await act(async () => {
      render(<AccentedInit />);
    });

    expect(mockAccented).toHaveBeenCalledTimes(1);
  });

  it("does not call accented() when NEXT_PUBLIC_ACCENTED is not 'true'", async () => {
    vi.stubEnv("NEXT_PUBLIC_ACCENTED", "false");

    await act(async () => {
      render(<AccentedInit />);
    });

    expect(mockAccented).not.toHaveBeenCalled();
  });

  it("renders nothing (returns null)", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCENTED", "false");
    const { container } = render(<AccentedInit />);
    expect(container).toBeEmptyDOMElement();
  });
});
