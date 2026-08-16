import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTheme } from "./useTheme";

describe("useTheme", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute("data-theme");
	});

	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		document.documentElement.removeAttribute("data-theme");
	});

	it("reads the stored theme from localStorage on mount", async () => {
		localStorage.setItem("theme", "dark");

		const { result } = renderHook(() => useTheme());

		await act(async () => {});

		expect(result.current.theme).toBe("dark");
	});

	it("defaults to light when localStorage has no stored theme", async () => {
		const { result } = renderHook(() => useTheme());

		await act(async () => {});

		expect(result.current.theme).toBe("light");
	});

	it("toggleTheme switches from light to dark and persists to localStorage", async () => {
		const { result } = renderHook(() => useTheme());

		await act(async () => {});
		expect(result.current.theme).toBe("light");

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("dark");
		expect(localStorage.getItem("theme")).toBe("dark");
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});

	it("toggleTheme switches from dark to light", async () => {
		localStorage.setItem("theme", "dark");

		const { result } = renderHook(() => useTheme());

		await act(async () => {});

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("light");
		expect(localStorage.getItem("theme")).toBe("light");
	});
});
