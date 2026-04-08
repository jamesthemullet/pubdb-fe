import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OpeningHoursDisplay from "./OpeningHoursDisplay";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

describe("OpeningHoursDisplay", () => {
  it("renders dashes for all days when value is undefined", () => {
    render(<OpeningHoursDisplay />);

    for (const day of DAYS) {
      expect(screen.getByText(`${day}:`).closest("div")).toHaveTextContent(
        `${day}: -`
      );
    }
  });

  it("renders dashes for all days when value is null", () => {
    render(<OpeningHoursDisplay value={null} />);

    for (const day of DAYS) {
      expect(screen.getByText(`${day}:`).closest("div")).toHaveTextContent(
        `${day}: -`
      );
    }
  });

  it("renders dashes when value is an invalid JSON string", () => {
    render(<OpeningHoursDisplay value="not-valid-json" />);

    for (const day of DAYS) {
      expect(screen.getByText(`${day}:`).closest("div")).toHaveTextContent(
        `${day}: -`
      );
    }
  });

  it("parses a valid JSON string and shows opening hours", () => {
    const json = JSON.stringify({
      Monday: { open: "09:00", close: "23:00" },
    });

    render(<OpeningHoursDisplay value={json} />);

    expect(screen.getByText("Monday:").closest("div")).toHaveTextContent(
      "Monday: 09:00 – 23:00"
    );
  });

  it("shows opening hours from an object map", () => {
    render(
      <OpeningHoursDisplay
        value={{
          Monday: { open: "10:00", close: "22:00" },
          Friday: { open: "11:00", close: "00:00" },
        }}
      />
    );

    expect(screen.getByText("Monday:").closest("div")).toHaveTextContent(
      "Monday: 10:00 – 22:00"
    );
    expect(screen.getByText("Friday:").closest("div")).toHaveTextContent(
      "Friday: 11:00 – 00:00"
    );
  });

  it("shows 'Closed' for days marked as closed", () => {
    render(
      <OpeningHoursDisplay
        value={{ Tuesday: { closed: true } }}
      />
    );

    expect(screen.getByText("Tuesday:").closest("div")).toHaveTextContent(
      "Tuesday: Closed"
    );
  });

  it("falls back to dash when open or close is missing", () => {
    render(
      <OpeningHoursDisplay
        value={{ Wednesday: { open: "12:00" } }}
      />
    );

    expect(screen.getByText("Wednesday:").closest("div")).toHaveTextContent(
      "Wednesday: 12:00 – -"
    );
  });

  it("shows dash for days not present in the map", () => {
    render(
      <OpeningHoursDisplay
        value={{ Monday: { open: "09:00", close: "23:00" } }}
      />
    );

    expect(screen.getByText("Sunday:").closest("div")).toHaveTextContent(
      "Sunday: -"
    );
  });

  it("matches days case-insensitively (lowercase keys in map)", () => {
    render(
      <OpeningHoursDisplay
        value={{ monday: { open: "08:00", close: "20:00" } }}
      />
    );

    expect(screen.getByText("Monday:").closest("div")).toHaveTextContent(
      "Monday: 08:00 – 20:00"
    );
  });
});
