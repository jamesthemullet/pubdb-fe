import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineEditSelectField from "./InlineEditSelectField";

const options = [
  { value: "uk", label: "United Kingdom" },
  { value: "ie", label: "Ireland" },
];

describe("InlineEditSelectField", () => {
  describe("display mode", () => {
    it("shows the label of the matching option", () => {
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={vi.fn()} />,
      );
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
    });

    it("shows emptyLabel when value is null", () => {
      render(
        <InlineEditSelectField
          label="Country"
          value={null}
          options={options}
          onSave={vi.fn()}
          emptyLabel="Select a country"
        />,
      );
      expect(screen.getByText("Select a country")).toBeInTheDocument();
    });

    it("shows an edit button when canEdit is true", () => {
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={vi.fn()} canEdit />,
      );
      expect(screen.getByRole("button", { name: "Edit Country" })).toBeInTheDocument();
    });

    it("does not show an edit button when canEdit is false", () => {
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={vi.fn()} canEdit={false} />,
      );
      expect(screen.queryByRole("button", { name: "Edit Country" })).not.toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("clicking edit shows a select pre-filled with the current value", () => {
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={vi.fn()} canEdit />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit Country" }));
      expect(screen.getByRole("combobox", { name: "Country" })).toHaveValue("uk");
    });

    it("calls onSave with the new value and exits editing on success", async () => {
      const onSave = vi.fn().mockResolvedValue(null);
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={onSave} canEdit />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit Country" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Country" }), {
        target: { value: "ie" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save Country" }));
      await waitFor(() => expect(onSave).toHaveBeenCalledWith("ie"));
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("calls onSave with null when the empty option is selected", async () => {
      const onSave = vi.fn().mockResolvedValue(null);
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={onSave} canEdit />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit Country" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Country" }), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save Country" }));
      await waitFor(() => expect(onSave).toHaveBeenCalledWith(null));
    });

    it("displays the error from onSave and stays in editing mode", async () => {
      const onSave = vi.fn().mockResolvedValue("Update failed");
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={onSave} canEdit />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit Country" }));
      fireEvent.click(screen.getByRole("button", { name: "Save Country" }));
      await waitFor(() => expect(screen.getByText("Update failed")).toBeInTheDocument());
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("cancel returns to display mode without calling onSave", () => {
      const onSave = vi.fn();
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={onSave} canEdit />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit Country" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
    });
  });

  describe("rowLayout", () => {
    it("renders the label and value side by side", () => {
      render(
        <InlineEditSelectField label="Country" value="uk" options={options} onSave={vi.fn()} rowLayout />,
      );
      expect(screen.getByText("Country")).toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
    });
  });
});
