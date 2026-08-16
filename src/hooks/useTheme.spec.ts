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

	it("reads dark theme from localStorage on mount", async () => {
		localStorage.setItem("theme", "dark");
		const { result } = renderHook(() => useTheme());
		await waitFor(() => expect(result.current.theme).toBe("dark"));
	});

	it("toggleTheme switches from light to dark, persists in localStorage and sets data-theme", async () => {
		const { result } = renderHook(() => useTheme());
		await waitFor(() => expect(result.current.theme).toBe("light"));

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("dark");
		expect(localStorage.getItem("theme")).toBe("dark");
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});

	it("responds to themeChanged events dispatched by other hooks", async () => {
		const { result } = renderHook(() => useTheme());
		await waitFor(() => expect(result.current.theme).toBe("light"));

		await act(async () => {
			localStorage.setItem("theme", "dark");
			window.dispatchEvent(new Event("themeChanged"));
		});

		expect(result.current.theme).toBe("dark");
	});
});
