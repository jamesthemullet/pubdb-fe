import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to light theme when localStorage is empty", async () => {
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.theme).toBe("light"));
  });

  it("reads stored dark theme from localStorage on mount", async () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.theme).toBe("dark"));
  });

  it("toggleTheme switches from light to dark and persists to DOM and localStorage", async () => {
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.theme).toBe("light"));

    act(() => {
      result.current.toggleTheme();
    });

    await waitFor(() => expect(result.current.theme).toBe("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
