import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/normalizeLeaderboard";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
import LeaderboardClient from "./LeaderboardClient";

function makeEntry(overrides: Partial<LeaderboardEntry> & Pick<LeaderboardEntry, "rank" | "userId" | "username">): LeaderboardEntry {
	return {
		displayName: "",
		totalAdded: 0,
		totalEdits: 0,
		totalContributions: 0,
		streak: 0,
		badges: [],
		nextBadges: [],
		rankChange: null,
		previousRank: null,
		previousTotalContributions: null,
		...overrides,
	};
}

const ALICE = makeEntry({ rank: 1, userId: "u1", username: "alice", displayName: "Alice Smith", totalAdded: 10, totalEdits: 5, totalContributions: 15 });
const BOB   = makeEntry({ rank: 2, userId: "u2", username: "bob",   displayName: "Bob Jones",  totalAdded: 8,  totalEdits: 3, totalContributions: 11 });
const CAROL = makeEntry({ rank: 3, userId: "u3", username: "carol", displayName: "Carol White", totalAdded: 5, totalEdits: 2, totalContributions: 7  });

function makeData(entries: LeaderboardEntry[] = [ALICE, BOB, CAROL], generatedAt = "2026-06-01T12:30:00Z"): LeaderboardData {
	const period = { since: null, leaderboard: entries };
	return {
		periods: { "7d": period, "30d": period, "90d": period, all: period },
		generatedAt,
	};
}

describe("LeaderboardClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
	});

	it("shows empty-state message when there are no contributors", () => {
		render(<LeaderboardClient data={makeData([])} />);
		expect(screen.getByText("No contributions recorded yet.")).toBeInTheDocument();
	});

	it("shows '—' in the filter bar when there are no contributors", () => {
		render(<LeaderboardClient data={makeData([])} />);
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("shows plural contributor count in the filter bar", () => {
		render(<LeaderboardClient data={makeData([ALICE, BOB])} />);
		expect(screen.getByText("2 contributors")).toBeInTheDocument();
	});

	it("shows singular 'contributor' for exactly one entry", () => {
		render(<LeaderboardClient data={makeData([ALICE])} />);
		expect(screen.getByText("1 contributor")).toBeInTheDocument();
	});

	it("renders all entry names in the full ranking table", () => {
		render(<LeaderboardClient data={makeData()} />);
		// Each name appears at least once (podium + table)
		expect(screen.getAllByText("Alice Smith").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Bob Jones").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Carol White").length).toBeGreaterThanOrEqual(1);
	});

	it("shows names in more than one place when podium is rendered (3+ entries)", () => {
		render(<LeaderboardClient data={makeData()} />);
		// With 3+ entries the podium renders, so Alice appears in both podium card and table row
		expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(1);
	});

	it("renders each name exactly once in the table when fewer than 3 entries (no podium)", () => {
		render(<LeaderboardClient data={makeData([ALICE, BOB])} />);
		// No podium section — each name appears in the table row and the "Top this week" panel
		expect(screen.getAllByText("Alice Smith")).toHaveLength(2);
		expect(screen.getAllByText("Bob Jones")).toHaveLength(2);
	});

	it("has the sort button labelled as descending by default", () => {
		render(<LeaderboardClient data={makeData()} />);
		const sortBtn = screen.getByRole("button", { name: /Sort by total contributions/ });
		expect(sortBtn).toHaveAttribute("aria-label", expect.stringContaining("descending"));
	});

	it("toggles sort direction label when the sort button is clicked", () => {
		render(<LeaderboardClient data={makeData()} />);
		const sortBtn = screen.getByRole("button", { name: /Sort by total contributions/ });

		fireEvent.click(sortBtn);
		expect(sortBtn).toHaveAttribute("aria-label", expect.stringContaining("ascending"));

		fireEvent.click(sortBtn);
		expect(sortBtn).toHaveAttribute("aria-label", expect.stringContaining("descending"));
	});

	it("reorders table rows to ascending when sort is switched to asc", () => {
		render(<LeaderboardClient data={makeData()} />);
		const sortBtn = screen.getByRole("button", { name: /Sort by total contributions/ });
		fireEvent.click(sortBtn); // switch to ascending

		const rows = screen.getAllByRole("row");
		// row[0] is <thead>, row[1] is first data row — should be Carol (lowest contributions)
		expect(rows[1]).toHaveTextContent("Carol");
	});

	it("shows 'YOUR RANK' banner when the authenticated user matches an entry by username", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<LeaderboardClient data={makeData()} />);
		expect(screen.getByText("YOUR RANK")).toBeInTheDocument();
	});

	it("labels the matching entry as 'You (name)' in the table", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<LeaderboardClient data={makeData()} />);
		expect(screen.getAllByText("You (Alice Smith)").length).toBeGreaterThan(0);
	});

	it("does not show 'YOUR RANK' banner when the user is not in the leaderboard", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "unknown@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<LeaderboardClient data={makeData()} />);
		expect(screen.queryByText("YOUR RANK")).not.toBeInTheDocument();
	});

	it("shows the snapshot timestamp from generatedAt", () => {
		render(<LeaderboardClient data={makeData([ALICE], "2026-06-01T14:30:00Z")} />);
		expect(screen.getByText(/Snapshot/)).toBeInTheDocument();
	});

	it("defaults to the 'Last 30 days' tab", () => {
		render(<LeaderboardClient data={makeData()} />);
		expect(screen.getByRole("button", { name: "Last 30 days" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
	});

	it("switches leaderboard entries when a different period tab is clicked", () => {
		const data: LeaderboardData = {
			periods: {
				"7d": { since: "2026-05-25T00:00:00Z", leaderboard: [ALICE] },
				"30d": { since: "2026-05-02T00:00:00Z", leaderboard: [ALICE, BOB] },
				"90d": { since: "2026-03-03T00:00:00Z", leaderboard: [ALICE, BOB, CAROL] },
				all: { since: null, leaderboard: [ALICE, BOB, CAROL] },
			},
			generatedAt: "2026-06-01T12:30:00Z",
		};
		render(<LeaderboardClient data={data} />);
		expect(screen.getByText("2 contributors")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
		expect(screen.getByText("1 contributor")).toBeInTheDocument();
		expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
	});

	it("shows a 'Top this week' panel ranking the top 5 contributors by pubs added", () => {
		render(<LeaderboardClient data={makeData()} />);
		const heading = screen.getByText("Top this week");
		expect(heading).toBeInTheDocument();
		expect(screen.getByText("by new pubs")).toBeInTheDocument();

		// heading -> sidebarPanelHeader -> sidebarPanel
		const panel = heading.parentElement?.parentElement as HTMLElement;
		const scoped = within(panel);

		// Ordered by totalAdded descending: Alice (10), Bob (8), Carol (5)
		const names = scoped
			.getAllByText(/Alice Smith|Bob Jones|Carol White/)
			.map((el) => el.textContent);
		expect(names).toEqual(["Alice Smith", "Bob Jones", "Carol White"]);
	});

	it("does not show the 'Top this week' panel when there are no 7-day entries", () => {
		const data: LeaderboardData = {
			periods: {
				"7d": { since: null, leaderboard: [] },
				"30d": { since: null, leaderboard: [ALICE] },
				"90d": { since: null, leaderboard: [ALICE] },
				all: { since: null, leaderboard: [ALICE] },
			},
			generatedAt: "2026-06-01T12:30:00Z",
		};
		render(<LeaderboardClient data={data} />);
		expect(screen.queryByText("Top this week")).not.toBeInTheDocument();
	});

	it("shows a 'Climbing fastest' panel ranking entries by rankChange descending, skipping null and non-positive entries", () => {
		const climbing = makeEntry({
			rank: 2,
			userId: "u4",
			username: "dave",
			displayName: "Dave Green",
			rankChange: 5,
			previousRank: 7,
		});
		const noChange = makeEntry({
			rank: 5,
			userId: "u5",
			username: "eve",
			displayName: "Eve Black",
			rankChange: null,
			previousRank: null,
		});
		const falling = makeEntry({
			rank: 2,
			userId: "u6",
			username: "frank",
			displayName: "Frank Stone",
			rankChange: -1,
			previousRank: 1,
		});
		const data = makeData([ALICE, climbing, noChange, falling]);
		render(<LeaderboardClient data={data} />);

		const heading = screen.getByText("Climbing fastest");
		expect(heading).toBeInTheDocument();
		expect(screen.getByText("vs previous period")).toBeInTheDocument();

		// heading -> sidebarPanelHeader -> sidebarPanel
		const panel = heading.parentElement?.parentElement as HTMLElement;
		const scoped = within(panel);

		expect(scoped.getByText("Dave Green")).toBeInTheDocument();
		expect(scoped.getByText("#7 → #2")).toBeInTheDocument();
		expect(scoped.getByText("+5")).toBeInTheDocument();
		expect(scoped.queryByText("Eve Black")).not.toBeInTheDocument();
		expect(scoped.queryByText("Frank Stone")).not.toBeInTheDocument();
	});

	it("does not show the 'Climbing fastest' panel when every entry with a rankChange has fallen or stayed put", () => {
		const falling = makeEntry({
			rank: 2,
			userId: "u6",
			username: "frank",
			displayName: "Frank Stone",
			rankChange: -1,
			previousRank: 1,
		});
		const data = makeData([ALICE, falling]);
		render(<LeaderboardClient data={data} />);
		expect(screen.queryByText("Climbing fastest")).not.toBeInTheDocument();
	});

	it("does not show the 'Climbing fastest' panel when no entries have a rankChange", () => {
		render(<LeaderboardClient data={makeData()} />);
		expect(screen.queryByText("Climbing fastest")).not.toBeInTheDocument();
	});
});
