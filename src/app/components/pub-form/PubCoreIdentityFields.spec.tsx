import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PubCoreIdentityFields from "./PubCoreIdentityFields";

const baseValues = {
  name: "The Harp",
  city: "London",
  country: "GB",
  address: "47 Chandos Place",
  postcode: "WC2N 4HS",
};

const countries = [
  { name: "United Kingdom", code: "GB" },
  { name: "France", code: "FR" },
];

function renderDefault(overrides: Parameters<typeof PubCoreIdentityFields>[0] = {}) {
  const props = {
    values: baseValues,
    onFieldChange: vi.fn(),
    countries,
    countriesLoading: false,
    ...overrides,
  };

  render(<PubCoreIdentityFields {...props} />);

  return props;
}

describe("PubCoreIdentityFields", () => {
  it("renders all field labels", () => {
    renderDefault();

    expect(screen.getByLabelText(/^Name:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^City:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Country:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Address:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Postcode:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Latitude:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Longitude:/i)).toBeInTheDocument();
  });

  it("populates inputs with the provided values", () => {
    renderDefault();

    expect(screen.getByLabelText(/^Name:/i)).toHaveValue("The Harp");
    expect(screen.getByLabelText(/^City:/i)).toHaveValue("London");
    expect(screen.getByLabelText(/^Address:/i)).toHaveValue("47 Chandos Place");
    expect(screen.getByLabelText(/^Postcode:/i)).toHaveValue("WC2N 4HS");
  });

  it("calls onFieldChange when an input changes", () => {
    const { onFieldChange } = renderDefault();

    fireEvent.change(screen.getByLabelText(/^Name:/i), {
      target: { value: "The Crown" },
    });

    expect(onFieldChange).toHaveBeenCalledWith("name", "The Crown");
  });

  it("renders country options from the countries prop", () => {
    renderDefault();

    expect(screen.getByRole("option", { name: "United Kingdom" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "France" })).toBeInTheDocument();
  });

  it("shows loading placeholder while countries are loading", () => {
    renderDefault({ countriesLoading: true, countries: [] });

    expect(
      screen.getByRole("option", { name: "Loading countries..." })
    ).toBeInTheDocument();
  });

  it("shows field error messages", () => {
    renderDefault({
      fieldErrors: {
        name: ["Name is required"],
        city: ["City is required"],
      },
    });

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("City is required")).toBeInTheDocument();
  });

  it("renders required asterisks by default", () => {
    const { container } = render(
      <PubCoreIdentityFields
        values={baseValues}
        onFieldChange={vi.fn()}
        countries={countries}
        countriesLoading={false}
      />
    );

    // Required fields (Name, City, Country, Address, Postcode) show asterisk
    const asterisks = container.querySelectorAll('[aria-hidden="true"]');
    expect(asterisks.length).toBeGreaterThan(0);
  });

  it("hides required asterisks when showRequiredMarkers is false", () => {
    const { container } = render(
      <PubCoreIdentityFields
        values={baseValues}
        onFieldChange={vi.fn()}
        countries={countries}
        countriesLoading={false}
        showRequiredMarkers={false}
      />
    );

    const asterisks = container.querySelectorAll('[aria-hidden="true"]');
    expect(asterisks.length).toBe(0);
  });

  it("shows placeholders when showPlaceholders is true", () => {
    renderDefault({ showPlaceholders: true });

    expect(screen.getByPlaceholderText("Enter pub name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter city")).toBeInTheDocument();
  });

  it("calls onFieldChange with a parsed float for lat/lng", () => {
    const { onFieldChange } = renderDefault();

    fireEvent.change(screen.getByLabelText(/^Latitude:/i), {
      target: { value: "51.5" },
    });

    expect(onFieldChange).toHaveBeenCalledWith("lat", 51.5);
  });

  it("calls onFieldChange with undefined for lat/lng when cleared", () => {
    const { onFieldChange } = renderDefault({
      values: { ...baseValues, lat: 51.5 },
    });

    fireEvent.change(screen.getByLabelText(/^Latitude:/i), {
      target: { value: "" },
    });

    expect(onFieldChange).toHaveBeenCalledWith("lat", undefined);
  });
});
