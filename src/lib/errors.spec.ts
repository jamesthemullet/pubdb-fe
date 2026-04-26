import { describe, expect, it } from "vitest";

import { getErrorMessage, isHttpErrorObject } from "./errors";

describe("isHttpErrorObject", () => {
  it("returns true for a valid HTTP error object", () => {
    const err = { response: new Response(), data: {} };
    expect(isHttpErrorObject(err)).toBe(true);
  });

  it("returns true when data has a message property", () => {
    const err = { response: new Response(), data: { message: "Not Found" } };
    expect(isHttpErrorObject(err)).toBe(true);
  });

  it("returns false for a plain Error instance", () => {
    expect(isHttpErrorObject(new Error("fail"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isHttpErrorObject(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isHttpErrorObject(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isHttpErrorObject("error string")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isHttpErrorObject(42)).toBe(false);
  });

  it("returns false when response property is missing", () => {
    expect(isHttpErrorObject({ data: {} })).toBe(false);
  });

  it("returns false when data property is missing", () => {
    expect(isHttpErrorObject({ response: new Response() })).toBe(false);
  });

  it("returns false when response is not a Response instance", () => {
    expect(isHttpErrorObject({ response: {}, data: {} })).toBe(false);
  });

  it("returns false when response is a plain object with status", () => {
    expect(isHttpErrorObject({ response: { status: 404 }, data: {} })).toBe(false);
  });
});

describe("getErrorMessage", () => {
  it("returns the message from an Error instance", () => {
    expect(getErrorMessage(new Error("something went wrong"), "fallback")).toBe(
      "something went wrong",
    );
  });

  it("returns fallback when Error has an empty message", () => {
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });

  it("returns message from an object with a message string property", () => {
    expect(getErrorMessage({ message: "API error" }, "fallback")).toBe("API error");
  });

  it("returns error from an object with an error string property", () => {
    expect(getErrorMessage({ error: "Not found" }, "fallback")).toBe("Not found");
  });

  it("prefers message over error when both are present", () => {
    expect(getErrorMessage({ message: "msg", error: "err" }, "fallback")).toBe("msg");
  });

  it("returns fallback when message is an empty string", () => {
    expect(getErrorMessage({ message: "" }, "fallback")).toBe("fallback");
  });

  it("returns fallback when message is a non-string type", () => {
    expect(getErrorMessage({ message: 42 }, "fallback")).toBe("fallback");
  });

  it("returns fallback for an empty object", () => {
    expect(getErrorMessage({}, "fallback")).toBe("fallback");
  });

  it("returns fallback for a string value", () => {
    expect(getErrorMessage("oops", "fallback")).toBe("fallback");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("returns fallback for a number", () => {
    expect(getErrorMessage(404, "fallback")).toBe("fallback");
  });
});
