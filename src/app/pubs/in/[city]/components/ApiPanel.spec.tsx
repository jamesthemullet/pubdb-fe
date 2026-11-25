import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Pub } from "@/types/pub";
import ApiPanel from "./ApiPanel";

const PUB: Pub = {
  id: "pub_1",
  name: "The Crown & Anchor",
  city: "Leeds",
  area: "City Centre",
  address: "1 Test St",
  postcode: "LS1 1AA",
  country: "GB",
  hasCaskAle: true,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("ApiPanel", () => {
  it("renders nothing when there are no pubs", () => {
    const { container } = render(
      <ApiPanel city="Leeds" pubs={[]} total={0} pageSize={50} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the request line for the city", () => {
    render(<ApiPanel city="Leeds" pubs={[PUB]} total={1} pageSize={50} />);

    expect(
      screen.getByRole("heading", { name: /get this data via the api/i })
    ).toBeInTheDocument();
    expect(screen.getByText("GET /pubs?city=Leeds")).toBeInTheDocument();
  });

  it("shows a trimmed sample JSON response built from the pubs on the page", () => {
    render(<ApiPanel city="Leeds" pubs={[PUB]} total={1} pageSize={50} />);

    expect(screen.getByText(/"name": "The Crown & Anchor"/)).toBeInTheDocument();
    expect(screen.getByText(/"success": true/)).toBeInTheDocument();
  });

  it("links to the docs, pricing and register pages", () => {
    render(<ApiPanel city="Leeds" pubs={[PUB]} total={1} pageSize={50} />);

    expect(screen.getByRole("link", { name: /read the docs/i })).toHaveAttribute(
      "href",
      "/docs"
    );
    expect(screen.getByRole("link", { name: /see pricing/i })).toHaveAttribute(
      "href",
      "/#pricing"
    );
    expect(
      screen.getByRole("link", { name: /get an api key/i })
    ).toHaveAttribute("href", "/register");
  });
});
