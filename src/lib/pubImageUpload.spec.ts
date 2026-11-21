import { afterEach, describe, expect, it, vi } from "vitest";

import type { Pub } from "@/types/pub";

import { uploadPubImage, validatePubImageSize } from "./pubImageUpload";

function makeFile(sizeInBytes: number): File {
  const file = new File(["x"], "pub.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: sizeInBytes });
  return file;
}

describe("validatePubImageSize", () => {
  it("returns an error message when the file is over 8MB", () => {
    expect(validatePubImageSize(makeFile(8 * 1024 * 1024 + 1))).toBe(
      "Image is too large — please choose a file under 8MB."
    );
  });

  it("returns null when the file is at or under 8MB", () => {
    expect(validatePubImageSize(makeFile(8 * 1024 * 1024))).toBeNull();
    expect(validatePubImageSize(makeFile(1024))).toBeNull();
  });
});

describe("uploadPubImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the size error without calling fetch when the file is too large", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadPubImage("pub-1", makeFile(9 * 1024 * 1024));

    expect(result).toEqual({
      error: "Image is too large — please choose a file under 8MB.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the pub on a successful upload", async () => {
    const pub = { id: "pub-1", name: "The Crown" } as Pub;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(pub),
      })
    );

    const result = await uploadPubImage("pub-1", makeFile(1024));

    expect(result).toEqual({ pub });
  });

  it("returns the API error message when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Only JPEG/PNG images are supported" }),
      })
    );

    const result = await uploadPubImage("pub-1", makeFile(1024));

    expect(result).toEqual({ error: "Only JPEG/PNG images are supported" });
  });

  it("falls back to a generic error when the response is not ok and has no string error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(null),
      })
    );

    const result = await uploadPubImage("pub-1", makeFile(1024));

    expect(result).toEqual({ error: "Failed to upload image" });
  });

  it("returns a network error message when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await uploadPubImage("pub-1", makeFile(1024));

    expect(result).toEqual({ error: "Network error" });
  });
});
