import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn().mockResolvedValue(undefined) },
			writable: true,
			configurable: true,
		});
	});

	it("shows 'Copied' and calls clipboard.writeText after click", async () => {
		render(<CopyButton text="hello world" />);

		expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
		});

		expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello world");
	});

	it("resets back to 'Copy' after 2 seconds", async () => {
		vi.useFakeTimers();

		render(<CopyButton text="reset me" />);

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
		});

		expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(2000);
		});

		expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();

		vi.useRealTimers();
	});
});
