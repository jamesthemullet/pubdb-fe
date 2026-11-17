import { describe, expect, it } from "vitest";
import { buildCityPageMetadata } from "./cityPageMetadata";

describe("buildCityPageMetadata", () => {
  it("uses the singular 'pub' for a count of one", () => {
    const meta = buildCityPageMetadata("Leeds", 1);
    expect(meta.description).toContain("1 pub in Leeds");
  });

  it("uses the plural 'pubs' for any other count", () => {
    const meta = buildCityPageMetadata("Leeds", 42);
    expect(meta.description).toContain("42 pubs in Leeds");
  });

  it("names the city in the title", () => {
    expect(buildCityPageMetadata("Newcastle upon Tyne", 5).title).toBe(
      "Pubs in Newcastle upon Tyne"
    );
  });
});
