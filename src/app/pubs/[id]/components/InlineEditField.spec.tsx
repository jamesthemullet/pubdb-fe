import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineEditField from "./InlineEditField";

describe("InlineEditField", () => {
  it("shows the display value and edit button when canEdit is true", () => {
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={vi.fn()}
        canEdit
      />,
    );
    expect(screen.getByText("The Crown")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Name" })).toBeInTheDocument();
  });

  it("does not show an edit button when canEdit is false", () => {
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={vi.fn()}
        canEdit={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Edit Name" })).not.toBeInTheDocument();
  });

  it("clicking edit shows an input pre-filled with the initial value", () => {
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={vi.fn()}
        canEdit
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Name" }));
    expect(screen.getByRole("textbox")).toHaveValue("The Crown");
  });

  it("calls onSave with the updated value and exits editing on success", async () => {
    const onSave = vi.fn().mockResolvedValue(null);
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={onSave}
        canEdit
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Name" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "The Rose" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Name" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("The Rose"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("displays the error returned from onSave and keeps editing mode open", async () => {
    const onSave = vi.fn().mockResolvedValue("Server error");
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={onSave}
        canEdit
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Name" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Name" }));
    await waitFor(() => expect(screen.getByText("Server error")).toBeInTheDocument());
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows a validation error and does not call onSave when validation fails", () => {
    const onSave = vi.fn();
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={onSave}
        validate={(v) => (v.trim() === "" ? "Name is required" : null)}
        canEdit
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Name" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Name" }));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("pressing Escape while editing cancels and returns to display mode", () => {
    render(
      <InlineEditField
        label="Name"
        displayValue="The Crown"
        initialValue="The Crown"
        onSave={vi.fn()}
        canEdit
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Name" }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("The Crown")).toBeInTheDocument();
  });
});
