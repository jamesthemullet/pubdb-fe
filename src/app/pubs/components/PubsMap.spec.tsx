import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Pub } from "@/types/pub";
import PubsMap from "./PubsMap";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("leaflet", () => ({
	default: {
		icon: vi.fn(() => ({})),
	},
}));

vi.mock("react-leaflet", () => ({
	MapContainer: ({ children }: { children: ReactNode }) => (
		<div data-testid="map-container">{children}</div>
	),
	TileLayer: () => <div data-testid="tile-layer" />,
	Marker: ({ children }: { children: ReactNode }) => (
		<div data-testid="marker">{children}</div>
	),
	Popup: ({ children }: { children: ReactNode }) => (
		<div data-testid="popup">{children}</div>
	),
}));

function pub(overrides: Partial<Pub>): Pub {
	return {
		id: "1",
		name: "The Harp",
		city: "London",
		address: "47 Chandos Place",
		postcode: "WC2N 4HS",
		country: "GB",
		createdAt: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

describe("PubsMap", () => {
	it("renders the map container", () => {
		render(<PubsMap pubs={[]} />);

		expect(screen.getByTestId("map-container")).toBeInTheDocument();
	});

	it("renders a marker for each pub with coordinates", () => {
		const pubs = [
			pub({ id: "1", name: "The Harp", lat: 51.5, lng: -0.1 }),
			pub({ id: "2", name: "The Crown", lat: 53.48, lng: -2.24 }),
		];

		render(<PubsMap pubs={pubs} />);

		expect(screen.getAllByTestId("marker")).toHaveLength(2);
		expect(screen.getByText("The Harp")).toBeInTheDocument();
		expect(screen.getByText("The Crown")).toBeInTheDocument();
	});

	it("excludes pubs without coordinates from the markers", () => {
		const pubs = [
			pub({ id: "1", name: "The Harp", lat: 51.5, lng: -0.1 }),
			pub({ id: "2", name: "No Coords Pub" }),
		];

		render(<PubsMap pubs={pubs} />);

		expect(screen.getAllByTestId("marker")).toHaveLength(1);
		expect(screen.queryByText("No Coords Pub")).not.toBeInTheDocument();
	});

	it("links each marker popup to the pub's detail page", () => {
		const pubs = [pub({ id: "42", name: "The Harp", lat: 51.5, lng: -0.1 })];

		render(<PubsMap pubs={pubs} />);

		expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
			"href",
			"/pubs/42",
		);
	});
});
