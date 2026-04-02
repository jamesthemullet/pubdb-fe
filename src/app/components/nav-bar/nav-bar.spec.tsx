import { fireEvent, render, screen } from "@testing-library/react";
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

function makeToken(payload: Record<string, unknown>) {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
}

describe("NavBar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when unauthenticated", () => {
    it("renders navigation links", () => {
      render(<NavBar />);

      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
        "href",
        "/"
      );
      expect(screen.getByRole("link", { name: "All Pubs" })).toHaveAttribute(
        "href",
        "/pubs"
      );
      expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
        "href",
        "/profile"
      );
      expect(screen.getByRole("link", { name: "Add Pub" })).toHaveAttribute(
        "href",
        "/add-pub"
      );
    });

    it("shows the Register link", () => {
      render(<NavBar />);

      expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
        "href",
        "/register"
      );
    });

    it("does not show user email or logout button", () => {
      render(<NavBar />);

      expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
    });
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      localStorage.setItem("token", makeToken({ email: "user@example.com" }));
    });

    it("shows the user email", () => {
      render(<NavBar />);

      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("hides the Register link", () => {
      render(<NavBar />);

      expect(screen.queryByRole("link", { name: "Register" })).toBeNull();
    });

    it("shows the Logout button", () => {
      render(<NavBar />);

      expect(
        screen.getByRole("button", { name: "Logout" })
      ).toBeInTheDocument();
    });

    it("clicking Logout removes token and dispatches authChanged", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      render(<NavBar />);

      fireEvent.click(screen.getByRole("button", { name: "Logout" }));

      expect(localStorage.getItem("token")).toBeNull();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "authChanged" })
      );
    });

    it("hides user email and logout button after logout", async () => {
      render(<NavBar />);

      fireEvent.click(screen.getByRole("button", { name: "Logout" }));

      expect(screen.queryByText("user@example.com")).toBeNull();
      expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
    });
  });

  describe("when token is malformed", () => {
    it("treats user as unauthenticated", () => {
      localStorage.setItem("token", "not.a.valid.jwt");
      render(<NavBar />);

      expect(
        screen.getByRole("link", { name: "Register" })
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
    });
  });

  describe("event listeners", () => {
    it("updates auth state when storage event fires", () => {
      render(<NavBar />);

      expect(
        screen.getByRole("link", { name: "Register" })
      ).toBeInTheDocument();

      localStorage.setItem("token", makeToken({ email: "other@example.com" }));
      fireEvent(window, new Event("storage"));

      expect(screen.getByText("other@example.com")).toBeInTheDocument();
    });

    it("updates auth state when authChanged event fires", () => {
      localStorage.setItem("token", makeToken({ email: "user@example.com" }));
      render(<NavBar />);

      expect(screen.getByText("user@example.com")).toBeInTheDocument();

      localStorage.removeItem("token");
      fireEvent(window, new Event("authChanged"));

      expect(screen.queryByText("user@example.com")).toBeNull();
      expect(
        screen.getByRole("link", { name: "Register" })
      ).toBeInTheDocument();
    });
  });
});
