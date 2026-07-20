import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";
import type { Dispatch, SetStateAction } from "react";

import type { Pub } from "@/types/pub";
import PubEditView from "./PubEditView";

vi.mock("@/app/features/opening-hours/opening-hours-editor", () => ({
  default: () => <div data-testid="opening-hours-editor" />,
}));

const BASE_PUB: Pub = {
  id: "42",
  name: "The Anchor",
  city: "Bristol",
  address: "5 King Street",
  postcode: "BS1 4EF",
  country: "GB",
  createdAt: "2024-01-15T10:00:00.000Z",
};

function renderView(overrides: {
  editFields?: Partial<Pub>;
  fieldErrors?: Record<string, string>;
  isAdmin?: boolean;
  isSaveDisabled?: boolean;
  saveError?: string | null;
  onFieldChange?: Mock<(field: keyof Pub, value: Pub[keyof Pub]) => void>;
  setFieldErrors?: Mock<Dispatch<SetStateAction<Record<string, string>>>>;
} = {}) {
  const props = {
    pub: BASE_PUB,
    pubDisplayId: "42",
    editFields: overrides.editFields ?? { ...BASE_PUB },
    fieldErrors: overrides.fieldErrors ?? {},
    saveError: overrides.saveError ?? null,
    isSaveDisabled: overrides.isSaveDisabled ?? false,
    isAdmin: overrides.isAdmin ?? false,
    onFieldChange: overrides.onFieldChange ?? vi.fn(),
    onToggleBeerType: vi.fn(),
    onUpdateBeerGarden: vi.fn(),
    onAddBeerGarden: vi.fn(),
    onRemoveBeerGarden: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(undefined),
    countries: [],
    countriesLoading: false,
    countriesError: null,
    beerTypeOptions: [],
    beerTypesLoading: false,
    beerTypesError: null,
    setFieldErrors: overrides.setFieldErrors ?? vi.fn(),
  };
  render(<PubEditView {...props} />);
  return props;
}

describe("PubEditView", () => {
  describe("basic fields", () => {
    it("renders the pub name input with the current editFields value", () => {
      renderView({ editFields: { ...BASE_PUB, name: "The Crown" } });
      expect(screen.getByLabelText(/Pub name/)).toHaveValue("The Crown");
    });

    it("calls onFieldChange with the new name when the name input changes", () => {
      const onFieldChange = vi.fn();
      renderView({ onFieldChange });
      fireEvent.change(screen.getByLabelText(/Pub name/), {
        target: { value: "The Crown" },
      });
      expect(onFieldChange).toHaveBeenCalledWith("name", "The Crown");
    });

    it("renders the save button and it is enabled by default", () => {
      renderView();
      expect(
        screen.getByRole("button", { name: /Save changes/ })
      ).not.toBeDisabled();
    });

    it("disables the save button when isSaveDisabled is true", () => {
      renderView({ isSaveDisabled: true });
      expect(
        screen.getByRole("button", { name: /Save changes/ })
      ).toBeDisabled();
    });

    it("displays a saveError message when provided", () => {
      renderView({ saveError: "Something went wrong" });
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("ownership / chain name", () => {
    it("hides the chain name field when pub is independent", () => {
      renderView({ editFields: { ...BASE_PUB, isIndependent: true } });
      expect(screen.queryByLabelText("Chain name")).not.toBeInTheDocument();
    });

    it("shows the chain name field when pub is a chain (isIndependent === false)", () => {
      renderView({ editFields: { ...BASE_PUB, isIndependent: false } });
      expect(screen.getByLabelText("Chain name")).toBeInTheDocument();
    });
  });

  describe("phone validation", () => {
    it("rejects non-numeric characters and shows a validation error", () => {
      const setFieldErrors = vi.fn();
      renderView({ setFieldErrors });
      fireEvent.change(screen.getByLabelText("Phone"), {
        target: { value: "abc" },
      });
      expect(setFieldErrors).toHaveBeenCalledWith(expect.any(Function));
    });

    it("accepts valid phone input and clears the phone error", () => {
      const onFieldChange = vi.fn();
      const setFieldErrors = vi.fn();
      renderView({ onFieldChange, setFieldErrors });
      fireEvent.change(screen.getByLabelText("Phone"), {
        target: { value: "+44 20 7946 0958" },
      });
      expect(onFieldChange).toHaveBeenCalledWith("phone", "+44 20 7946 0958");
      expect(setFieldErrors).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("danger zone (admin-only)", () => {
    it("does not render the delete button for non-admin users", () => {
      renderView({ isAdmin: false });
      expect(
        screen.queryByRole("button", { name: /Delete pub/ })
      ).not.toBeInTheDocument();
    });

    it("renders the delete button for admin users", () => {
      renderView({ isAdmin: true });
      expect(
        screen.getByRole("button", { name: /Delete pub/ })
      ).toBeInTheDocument();
    });

    it("calls onDelete when the delete button is clicked", () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const props = {
        pub: BASE_PUB,
        pubDisplayId: "42",
        editFields: { ...BASE_PUB },
        fieldErrors: {},
        saveError: null,
        isSaveDisabled: false,
        isAdmin: true,
        onFieldChange: vi.fn(),
        onToggleBeerType: vi.fn(),
        onUpdateBeerGarden: vi.fn(),
        onAddBeerGarden: vi.fn(),
        onRemoveBeerGarden: vi.fn(),
        onSave: vi.fn(),
        onDelete,
        countries: [],
        countriesLoading: false,
        countriesError: null,
        beerTypeOptions: [],
        beerTypesLoading: false,
        beerTypesError: null,
        setFieldErrors: vi.fn(),
      };
      render(<PubEditView {...props} />);
      fireEvent.click(screen.getByRole("button", { name: /Delete pub/ }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("collapsible sections", () => {
    it("opening hours section is collapsed by default", () => {
      renderView();
      expect(
        screen.queryByTestId("opening-hours-editor")
      ).not.toBeInTheDocument();
    });

    it("opening hours section expands when its header is clicked", () => {
      renderView();
      fireEvent.click(
        screen.getByRole("button", { name: /Opening hours/ })
      );
      expect(screen.getByTestId("opening-hours-editor")).toBeInTheDocument();
    });
  });
});
