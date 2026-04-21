import { describe, expect, it } from "vitest";
import { parseGoogleHours } from "./parse-google-hours";

const GOOGLE_SAMPLE = `Thursday
5–9:30 pm

Friday
5–10:30 pm

Saturday
12:30–10:30 pm

Sunday
12:30–9:30 pm

Monday
5–9:30 pm

Tuesday
5–9:30 pm

Wednesday
5–9:30 pm`;

describe("parseGoogleHours", () => {
  it("parses a full week pasted from Google", () => {
    const result = parseGoogleHours(GOOGLE_SAMPLE);
    expect(result).not.toBeNull();
    expect(result!.Monday).toEqual({
      open: "17:00",
      close: "21:30",
      closed: false,
    });
    expect(result!.Tuesday).toEqual({
      open: "17:00",
      close: "21:30",
      closed: false,
    });
    expect(result!.Wednesday).toEqual({
      open: "17:00",
      close: "21:30",
      closed: false,
    });
    expect(result!.Thursday).toEqual({
      open: "17:00",
      close: "21:30",
      closed: false,
    });
    expect(result!.Friday).toEqual({
      open: "17:00",
      close: "22:30",
      closed: false,
    });
    expect(result!.Saturday).toEqual({
      open: "12:30",
      close: "22:30",
      closed: false,
    });
    expect(result!.Sunday).toEqual({
      open: "12:30",
      close: "21:30",
      closed: false,
    });
  });

  it("handles am times", () => {
    const result = parseGoogleHours("Monday\n9 am–5 pm");
    expect(result!.Monday).toEqual({
      open: "09:00",
      close: "17:00",
      closed: false,
    });
  });

  it("handles midnight (12 am)", () => {
    const result = parseGoogleHours("Monday\n9 pm–12 am");
    expect(result!.Monday).toEqual({
      open: "21:00",
      close: "00:00",
      closed: false,
    });
  });

  it("handles noon (12 pm) as open time", () => {
    const result = parseGoogleHours("Saturday\n12–11 pm");
    expect(result!.Saturday).toEqual({
      open: "12:00",
      close: "23:00",
      closed: false,
    });
  });

  it("marks a day as closed", () => {
    const result = parseGoogleHours("Monday\nClosed");
    expect(result!.Monday).toEqual({ open: "", close: "", closed: true });
  });

  it("is case-insensitive for day names", () => {
    const result = parseGoogleHours("monday\n5–9:30 pm");
    expect(result!.Monday).toEqual({
      open: "17:00",
      close: "21:30",
      closed: false,
    });
  });

  it("returns null for unrecognisable input", () => {
    expect(parseGoogleHours("not a schedule at all")).toBeNull();
  });

  it("fills missing days with empty hours", () => {
    const result = parseGoogleHours("Monday\n5–9 pm");
    expect(result!.Tuesday).toEqual({ open: "", close: "", closed: false });
  });

  it("handles hyphen as separator when en-dash is absent", () => {
    const result = parseGoogleHours("Monday\n5-9:30 pm");
    expect(result!.Monday).toEqual({
      open: "17:00",
      close: "21:30",
      closed: false,
    });
  });
});
