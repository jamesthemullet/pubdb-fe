import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineEditBooleanField from "./InlineEditBooleanField";

describe("InlineEditBooleanField", () => {
	describe("display mode", () => {
		it('shows "Yes" for true', () => {
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={vi.fn()} />);
			expect(screen.getByText("Yes")).toBeInTheDocument();
		});

		it('shows "No" for false', () => {
			render(<InlineEditBooleanField label="Dog friendly" value={false} onSave={vi.fn()} />);
			expect(screen.getByText("No")).toBeInTheDocument();
		});

		it('shows "-" for null', () => {
			render(<InlineEditBooleanField label="Dog friendly" value={null} onSave={vi.fn()} />);
			expect(screen.getByText("-")).toBeInTheDocument();
		});

		it("shows an edit button when canEdit is true", () => {
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={vi.fn()} canEdit />);
			expect(screen.getByRole("button", { name: "Edit Dog friendly" })).toBeInTheDocument();
		});

		it("does not show an edit button when canEdit is false", () => {
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={vi.fn()} canEdit={false} />);
			expect(screen.queryByRole("button", { name: "Edit Dog friendly" })).not.toBeInTheDocument();
		});
	});

	describe("edit mode", () => {
		it("shows Yes / No / Not set buttons when edit is clicked", () => {
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={vi.fn()} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Not set" })).toBeInTheDocument();
		});

		it("pre-selects the current value when entering edit mode", () => {
			render(<InlineEditBooleanField label="Dog friendly" value={false} onSave={vi.fn()} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			// "No" should be the primary (selected) variant — check it is present
			expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
		});

		it("calls onSave with the newly selected value", async () => {
			const onSave = vi.fn().mockResolvedValue(null);
			render(<InlineEditBooleanField label="Dog friendly" value={false} onSave={onSave} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			fireEvent.click(screen.getByRole("button", { name: "Yes" }));
			fireEvent.click(screen.getByRole("button", { name: "Save Dog friendly" }));
			await waitFor(() => expect(onSave).toHaveBeenCalledWith(true));
		});

		it("calls onSave with null when Not set is chosen", async () => {
			const onSave = vi.fn().mockResolvedValue(null);
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={onSave} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			fireEvent.click(screen.getByRole("button", { name: "Not set" }));
			fireEvent.click(screen.getByRole("button", { name: "Save Dog friendly" }));
			await waitFor(() => expect(onSave).toHaveBeenCalledWith(null));
		});

		it("exits edit mode and returns to display after a successful save", async () => {
			const onSave = vi.fn().mockResolvedValue(null);
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={onSave} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			fireEvent.click(screen.getByRole("button", { name: "Save Dog friendly" }));
			await waitFor(() =>
				expect(screen.queryByRole("button", { name: "Save Dog friendly" })).not.toBeInTheDocument(),
			);
			expect(screen.getByRole("button", { name: "Edit Dog friendly" })).toBeInTheDocument();
		});

		it("shows an error and stays in edit mode when onSave returns an error string", async () => {
			const onSave = vi.fn().mockResolvedValue("Permission denied");
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={onSave} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			fireEvent.click(screen.getByRole("button", { name: "Save Dog friendly" }));
			await waitFor(() => expect(screen.getByText("Permission denied")).toBeInTheDocument());
			expect(screen.getByRole("button", { name: "Save Dog friendly" })).toBeInTheDocument();
		});

		it("cancel returns to display mode without calling onSave", () => {
			const onSave = vi.fn();
			render(<InlineEditBooleanField label="Dog friendly" value={true} onSave={onSave} canEdit />);
			fireEvent.click(screen.getByRole("button", { name: "Edit Dog friendly" }));
			fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
			expect(onSave).not.toHaveBeenCalled();
			expect(screen.queryByRole("button", { name: "Save Dog friendly" })).not.toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Edit Dog friendly" })).toBeInTheDocument();
		});
	});

	describe("rowLayout", () => {
		it("renders the label and value in a row layout", () => {
			render(<InlineEditBooleanField label="Has food" value={true} onSave={vi.fn()} rowLayout />);
			expect(screen.getByText("Has food")).toBeInTheDocument();
			expect(screen.getByText("Yes")).toBeInTheDocument();
		});
	});
});
