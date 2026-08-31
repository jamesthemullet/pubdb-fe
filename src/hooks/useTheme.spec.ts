import { act, renderHook } from "@testing-library/react";
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

  it("defaults to light theme when localStorage is empty", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("reads the stored theme from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("setTheme updates the theme state, localStorage, and data-theme attribute", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("toggleTheme switches from light to dark", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme switches from dark to light", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
  });

  it("updates theme state when a themeChanged event is dispatched externally", async () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      localStorage.setItem("theme", "dark");
      window.dispatchEvent(new Event("themeChanged"));
    });

    expect(result.current.theme).toBe("dark");
  });

  it("updates theme state when a storage event is dispatched", async () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      localStorage.setItem("theme", "dark");
      window.dispatchEvent(new Event("storage"));
    });

    expect(result.current.theme).toBe("dark");
  });
});
