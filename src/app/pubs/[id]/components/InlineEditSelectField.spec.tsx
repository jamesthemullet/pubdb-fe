import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineEditSelectField from "./InlineEditSelectField";

const OPTIONS = [
	{ value: "pub", label: "Traditional Pub" },
	{ value: "bar", label: "Bar" },
	{ value: "inn", label: "Inn" },
];

describe("InlineEditSelectField", () => {
	it("displays the option label matching the current value", () => {
		render(
			<InlineEditSelectField
				label="Pub type"
				value="bar"
				options={OPTIONS}
				onSave={vi.fn()}
			/>,
		);
		expect(screen.getByText("Bar")).toBeInTheDocument();
	});

	it("shows emptyLabel when value is null", () => {
		render(
			<InlineEditSelectField
				label="Pub type"
				value={null}
				options={OPTIONS}
				emptyLabel="Not set"
				onSave={vi.fn()}
			/>,
		);
		expect(screen.getByText("Not set")).toBeInTheDocument();
	});

	it("does not show an edit button when canEdit is false", () => {
		render(
			<InlineEditSelectField
				label="Pub type"
				value="pub"
				options={OPTIONS}
				onSave={vi.fn()}
				canEdit={false}
			/>,
		);
		expect(screen.queryByRole("button", { name: "Edit Pub type" })).not.toBeInTheDocument();
	});

	it("shows an edit button when canEdit is true", () => {
		render(
			<InlineEditSelectField
				label="Pub type"
				value="pub"
				options={OPTIONS}
				onSave={vi.fn()}
				canEdit
			/>,
		);
		expect(screen.getByRole("button", { name: "Edit Pub type" })).toBeInTheDocument();
	});

	it("clicking edit shows a select pre-filled with the current value", () => {
		render(
			<InlineEditSelectField
				label="Pub type"
				value="bar"
				options={OPTIONS}
				onSave={vi.fn()}
				canEdit
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit Pub type" }));
		expect(screen.getByRole("combobox", { name: "Pub type" })).toHaveValue("bar");
	});

	it("calls onSave with the selected value and exits edit mode on success", async () => {
		const onSave = vi.fn().mockResolvedValue(null);
		render(
			<InlineEditSelectField
				label="Pub type"
				value="pub"
				options={OPTIONS}
				onSave={onSave}
				canEdit
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit Pub type" }));
		fireEvent.change(screen.getByRole("combobox", { name: "Pub type" }), {
			target: { value: "inn" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save Pub type" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledWith("inn"));
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("shows an error and stays in edit mode when onSave returns an error string", async () => {
		const onSave = vi.fn().mockResolvedValue("Permission denied");
		render(
			<InlineEditSelectField
				label="Pub type"
				value="pub"
				options={OPTIONS}
				onSave={onSave}
				canEdit
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit Pub type" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Pub type" }));
		await waitFor(() => expect(screen.getByText("Permission denied")).toBeInTheDocument());
		expect(screen.getByRole("combobox")).toBeInTheDocument();
	});

	it("cancel returns to display mode without calling onSave", () => {
		const onSave = vi.fn();
		render(
			<InlineEditSelectField
				label="Pub type"
				value="pub"
				options={OPTIONS}
				onSave={onSave}
				canEdit
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit Pub type" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onSave).not.toHaveBeenCalled();
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		expect(screen.getByText("Traditional Pub")).toBeInTheDocument();
	});
});
