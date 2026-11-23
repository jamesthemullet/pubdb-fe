import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import type { Pub } from "@/types/pub";
import HelpImprovePanel from "./HelpImprovePanel";

const MINIMAL_PUB: Pub = {
  id: "1",
  name: "The Incomplete Arms",
  city: "Leeds",
  address: "1 Test St",
  postcode: "LS1 1AA",
  country: "GB",
  createdAt: "2024-01-01T00:00:00Z",
};

const allAmenities = Object.fromEntries(
  PUB_AMENITY_FIELDS.map(({ key }) => [key, true])
) as Partial<Pub>;

const COMPLETE_PUB: Pub = {
  ...MINIMAL_PUB,
  ...allAmenities,
  id: "2",
  name: "The Complete Arms",
  description: "A great pub",
  imageUrl: "https://example.com/img.jpg",
  openingHours: { monday: { open: "12:00", close: "23:00" } },
  beerTypes: [{ id: "1", name: "IPA" }],
  website: "https://testpub.com",
  phone: "01234 567890",
  beerGardens: [{ name: "Main garden" }],
};

describe("HelpImprovePanel", () => {
  it("renders nothing when every pub is complete", () => {
    const { container } = render(
      <HelpImprovePanel city="Leeds" pubs={[COMPLETE_PUB]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no pubs", () => {
    const { container } = render(<HelpImprovePanel city="Leeds" pubs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists incomplete pubs with what's missing, linking to the pub page", () => {
    render(<HelpImprovePanel city="Leeds" pubs={[MINIMAL_PUB]} />);

    expect(
      screen.getByRole("heading", { name: /help improve Leeds/i })
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /the incomplete arms/i });
    expect(link).toHaveAttribute("href", "/pubs/1");
    expect(screen.getByText(/Missing/)).toHaveTextContent("description");
  });

  it("excludes complete pubs from the list", () => {
    render(
      <HelpImprovePanel city="Leeds" pubs={[MINIMAL_PUB, COMPLETE_PUB]} />
    );

    expect(
      screen.getByRole("link", { name: /the incomplete arms/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /the complete arms/i })
    ).not.toBeInTheDocument();
  });

  it("links to /add-pub to report a missing pub", () => {
    render(<HelpImprovePanel city="Leeds" pubs={[MINIMAL_PUB]} />);

    expect(
      screen.getByRole("link", { name: /know a pub we're missing/i })
    ).toHaveAttribute("href", "/add-pub");
  });

  it("shows at most 5 pubs, ranked least complete first", () => {
    const pubs: Pub[] = Array.from({ length: 7 }, (_, i) => ({
      ...MINIMAL_PUB,
      id: String(i + 1),
      name: `Pub ${i + 1}`,
    }));

    render(<HelpImprovePanel city="Leeds" pubs={pubs} />);

    expect(screen.getAllByRole("link", { name: /^pub \d$/i })).toHaveLength(5);
  });
});
