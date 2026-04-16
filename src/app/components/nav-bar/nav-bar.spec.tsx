import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NavBar from "./nav-bar";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("NavBar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when unauthenticated", () => {
    beforeEach(() => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    });

    it("renders navigation links", async () => {
      render(<NavBar />);

      await waitFor(() =>
        expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument()
      );

      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: "All Pubs" })).toHaveAttribute("href", "/pubs");
      expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
      expect(screen.getByRole("link", { name: "Add Pub" })).toHaveAttribute("href", "/add-pub");
    });

    it("shows the Register link", async () => {
      render(<NavBar />);

      expect(
        await screen.findByRole("link", { name: "Register" })
      ).toHaveAttribute("href", "/register");
    });

    it("does not show user email or logout button", async () => {
      render(<NavBar />);

      await waitFor(() =>
        expect(screen.queryByRole("button", { name: "Logout" })).toBeNull()
      );
    });
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ email: "user@example.com" })
      );
    });

    it("shows the user email", async () => {
      render(<NavBar />);

      expect(await screen.findByText("user@example.com")).toBeInTheDocument();
    });

    it("hides the Register link", async () => {
      render(<NavBar />);

      await screen.findByText("user@example.com");

      expect(screen.queryByRole("link", { name: "Register" })).toBeNull();
    });

    it("shows the Logout button", async () => {
      render(<NavBar />);

      expect(
        await screen.findByRole("button", { name: "Logout" })
      ).toBeInTheDocument();
    });

    it("clicking Logout calls /api/auth/logout, dispatches authChanged, and hides user info", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(jsonResponse({ email: "user@example.com" }))
        .mockResolvedValue(jsonResponse({ success: true }));

      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      render(<NavBar />);

      const logoutButton = await screen.findByRole("button", { name: "Logout" });
      fireEvent.click(logoutButton);

      await waitFor(() =>
        expect(screen.queryByText("user@example.com")).toBeNull()
      );

      expect(fetchSpy).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "authChanged" })
      );
      expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
    });
  });

  describe("event listeners", () => {
    it("updates auth state when authChanged event fires", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(jsonResponse({ email: "user@example.com" }))
        .mockResolvedValueOnce(jsonResponse({}, 401));

      render(<NavBar />);

      await screen.findByText("user@example.com");

      fireEvent(window, new Event("authChanged"));

      await waitFor(() =>
        expect(screen.queryByText("user@example.com")).toBeNull()
      );
      expect(
        screen.getByRole("link", { name: "Register" })
      ).toBeInTheDocument();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
