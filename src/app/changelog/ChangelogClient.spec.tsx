import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChangelogVersion } from "@/lib/normalizeChangelog";
import ChangelogClient from "./ChangelogClient";

function makeVersion(overrides: Partial<ChangelogVersion> & Pick<ChangelogVersion, "version">): ChangelogVersion {
	return {
		date: "2026-01-15",
		items: [{ type: "added", text: "New feature" }],
		...overrides,
	};
}

describe("ChangelogClient", () => {
	it("shows an empty-state message when versions is an empty array", () => {
		render(<ChangelogClient versions={[]} />);
		expect(screen.getByText("No changelog entries yet.")).toBeInTheDocument();
	});

	it("renders the version number prefixed with v", () => {
		render(<ChangelogClient versions={[makeVersion({ version: "1.2.3" })]} />);
		expect(screen.getByText("v1.2.3")).toBeInTheDocument();
	});

	it("formats a valid ISO date with toLocaleDateString", () => {
		render(<ChangelogClient versions={[makeVersion({ version: "1.0.0", date: "2026-03-05" })]} />);
		const formatted = new Date("2026-03-05").toLocaleDateString(undefined, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		expect(screen.getByText(formatted)).toBeInTheDocument();
	});

	it("returns the raw string for an invalid date", () => {
		render(<ChangelogClient versions={[makeVersion({ version: "0.9.0", date: "TBD" })]} />);
		expect(screen.getByText("TBD")).toBeInTheDocument();
	});

	it("renders 'Added', 'Changed', and 'Fixed' type badges", () => {
		render(
			<ChangelogClient
				versions={[
					{
						version: "2.0.0",
						date: "2026-06-01",
						items: [
							{ type: "added", text: "Added something" },
							{ type: "changed", text: "Changed something" },
							{ type: "fixed", text: "Fixed something" },
						],
					},
				]}
			/>
		);
		expect(screen.getByText("Added")).toBeInTheDocument();
		expect(screen.getByText("Changed")).toBeInTheDocument();
		expect(screen.getByText("Fixed")).toBeInTheDocument();
	});

	it("renders the changelog heading and endpoint badge", () => {
		render(<ChangelogClient versions={[makeVersion({ version: "1.0.0" })]} />);
		expect(screen.getByRole("heading", { name: "Changelog" })).toBeInTheDocument();
		expect(screen.getByText("GET /v1/changelog")).toBeInTheDocument();
	});

	it("renders multiple versions in order", () => {
		render(
			<ChangelogClient
				versions={[
					makeVersion({ version: "2.0.0", items: [{ type: "added", text: "v2 feature" }] }),
					makeVersion({ version: "1.0.0", items: [{ type: "fixed", text: "v1 fix" }] }),
				]}
			/>
		);
		expect(screen.getByText("v2.0.0")).toBeInTheDocument();
		expect(screen.getByText("v1.0.0")).toBeInTheDocument();
		expect(screen.getByText("v2 feature")).toBeInTheDocument();
		expect(screen.getByText("v1 fix")).toBeInTheDocument();
	});
});
