import { fireEvent, render, screen } from "@testing-library/react";
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
		...overrides,
	};
}

const ALICE = makeEntry({ rank: 1, userId: "u1", username: "alice", displayName: "Alice Smith", totalAdded: 10, totalEdits: 5, totalContributions: 15 });
const BOB   = makeEntry({ rank: 2, userId: "u2", username: "bob",   displayName: "Bob Jones",  totalAdded: 8,  totalEdits: 3, totalContributions: 11 });
const CAROL = makeEntry({ rank: 3, userId: "u3", username: "carol", displayName: "Carol White", totalAdded: 5, totalEdits: 2, totalContributions: 7  });

function makeData(entries: LeaderboardEntry[] = [ALICE, BOB, CAROL], generatedAt = "2026-06-01T12:30:00Z"): LeaderboardData {
	return { leaderboard: entries, since: null, generatedAt };
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

	it("renders each name exactly once when fewer than 3 entries (no podium)", () => {
		render(<LeaderboardClient data={makeData([ALICE, BOB])} />);
		// No podium section — each name appears only in the table
		expect(screen.getAllByText("Alice Smith")).toHaveLength(1);
		expect(screen.getAllByText("Bob Jones")).toHaveLength(1);
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
});
