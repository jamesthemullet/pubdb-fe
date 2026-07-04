import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LeaderboardData } from "@/lib/normalizeLeaderboard";

vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

import { useAuth } from "@/hooks/useAuth";
import LeaderboardClient from "./LeaderboardClient";

const SAMPLE_ENTRIES = [
	{
		rank: 1,
		userId: "u1",
		displayName: "Alice Smith",
		username: "alice",
		totalAdded: 10,
		totalEdits: 5,
		totalContributions: 15,
	},
	{
		rank: 2,
		userId: "u2",
		displayName: "Bob Jones",
		username: "bob",
		totalAdded: 8,
		totalEdits: 3,
		totalContributions: 11,
	},
	{
		rank: 3,
		userId: "u3",
		displayName: "",
		username: "charlie",
		totalAdded: 5,
		totalEdits: 2,
		totalContributions: 7,
	},
	{
		rank: 4,
		userId: "u4",
		displayName: "Dave Wilson",
		username: "dave",
		totalAdded: 3,
		totalEdits: 1,
		totalContributions: 4,
	},
];

const SAMPLE_DATA: LeaderboardData = {
	leaderboard: SAMPLE_ENTRIES,
	since: "2026-01-01",
	generatedAt: "2026-07-04T12:00:00.000Z",
};

const EMPTY_DATA: LeaderboardData = {
	leaderboard: [],
	since: null,
	generatedAt: "2026-07-04T12:00:00.000Z",
};

describe("LeaderboardClient", () => {
	beforeEach(() => {
		vi.mocked(useAuth).mockReturnValue({
			user: null,
			isApproved: false,
			isAdmin: false,
		});
	});

	it("shows an empty state message when there are no leaderboard entries", () => {
		render(<LeaderboardClient data={EMPTY_DATA} />);
		expect(
			screen.getByText("No contributions recorded yet."),
		).toBeInTheDocument();
	});

	it("shows the contributor count in the filter bar", () => {
		render(<LeaderboardClient data={SAMPLE_DATA} />);
		expect(screen.getByText("4 contributors")).toBeInTheDocument();
	});

	it("flips table order when the sort button is clicked", () => {
		render(<LeaderboardClient data={SAMPLE_DATA} />);

		const rows = screen.getAllByRole("row");
		expect(rows[1]).toHaveTextContent("Alice Smith");

		fireEvent.click(
			screen.getByRole("button", { name: /Sort by total contributions/ }),
		);

		const rowsAfterSort = screen.getAllByRole("row");
		expect(rowsAfterSort[1]).toHaveTextContent("Dave Wilson");
	});

	it("shows a YOUR RANK banner when the logged-in user is on the leaderboard", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com" },
			isApproved: true,
			isAdmin: false,
		});
		render(<LeaderboardClient data={SAMPLE_DATA} />);
		expect(screen.getByText("YOUR RANK")).toBeInTheDocument();
	});
});
