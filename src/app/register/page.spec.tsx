import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RegisterLoginPage from "./page";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function input(container: HTMLElement, field: "name" | "username" | "email" | "password"): HTMLInputElement | null {
  const idMap = { name: "ag-name", username: "ag-username", email: "ag-email", password: "ag-password" };
  return container.querySelector(`#${idMap[field]}`);
}

describe("RegisterLoginPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("login mode (default)", () => {
    it("renders the login heading and email/password fields only", () => {
      const { container } = render(<RegisterLoginPage />);

      expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
      expect(input(container, "email")).toBeInTheDocument();
      expect(input(container, "password")).toBeInTheDocument();
      expect(input(container, "name")).toBeNull();
      expect(input(container, "username")).toBeNull();
      expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    });

    it("shows toggle button to switch to register", () => {
      render(<RegisterLoginPage />);
      expect(
        screen.getByRole("button", { name: /create an account/i })
      ).toBeInTheDocument();
    });

    it("shows forgot password link in login mode", () => {
      render(<RegisterLoginPage />);
      expect(
        screen.getByRole("link", { name: /forgot password/i })
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("calls login API, stores token, and dispatches authChanged", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ token: "jwt-abc" })
      );
      const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "email")!, { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "mypassword" } });
      fireEvent.click(screen.getByRole("button", { name: "Log in" }));

      await waitFor(() =>
        expect(localStorageSpy).toHaveBeenCalledWith("token", "jwt-abc")
      );

      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    });

    it("shows API error on failed login", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ error: "Invalid credentials" }, 401)
      );

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "email")!, { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "wrong" } });
      fireEvent.click(screen.getByRole("button", { name: "Log in" }));

      await waitFor(() =>
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
      );
    });

    it("shows network error on fetch failure in login mode", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "email")!, { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "pw" } });
      fireEvent.click(screen.getByRole("button", { name: "Log in" }));

      await waitFor(() =>
        expect(screen.getByText("Network error")).toBeInTheDocument()
      );
    });

    it("sends only email and password to login endpoint", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ token: "tok" })
      );

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "email")!, { target: { value: "me@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "pass" } });
      fireEvent.click(screen.getByRole("button", { name: "Log in" }));

      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:4000/auth/login",
        expect.objectContaining({
          body: JSON.stringify({ email: "me@example.com", password: "pass" }),
        })
      );
    });
  });

  describe("register mode", () => {
    function switchToRegister() {
      const result = render(<RegisterLoginPage />);
      fireEvent.click(
        screen.getByRole("button", { name: /create an account/i })
      );
      return result;
    }

    it("renders the register heading and all form fields", () => {
      const { container } = switchToRegister();

      expect(screen.getByRole("heading", { name: "Create an account" })).toBeInTheDocument();
      expect(input(container, "name")).toBeInTheDocument();
      expect(input(container, "username")).toBeInTheDocument();
      expect(input(container, "email")).toBeInTheDocument();
      expect(input(container, "password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create account" })
      ).toBeInTheDocument();
    });

    it("shows toggle button to switch to login", () => {
      switchToRegister();
      expect(
        screen.getByRole("button", { name: /^log in$/i })
      ).toBeInTheDocument();
    });

    it("does not show the forgot password link in register mode", () => {
      switchToRegister();
      expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
    });

    it("calls register API on submit and shows success message", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ message: "registered" })
      );

      const { container } = switchToRegister();

      fireEvent.change(input(container, "name")!, { target: { value: "Alice" } });
      fireEvent.change(input(container, "username")!, { target: { value: "alice123" } });
      fireEvent.change(input(container, "email")!, { target: { value: "alice@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "secret" } });

      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() =>
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:4000/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Alice",
            username: "alice123",
            email: "alice@example.com",
            password: "secret",
          }),
        })
      );
    });

    it("shows API error on failed registration", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ error: "Email already in use" }, 400)
      );

      const { container } = switchToRegister();

      fireEvent.change(input(container, "name")!, { target: { value: "Alice" } });
      fireEvent.change(input(container, "username")!, { target: { value: "alice" } });
      fireEvent.change(input(container, "email")!, { target: { value: "taken@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() =>
        expect(screen.getByText("Email already in use")).toBeInTheDocument()
      );
    });

    it("shows network error on fetch failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      const { container } = switchToRegister();

      fireEvent.change(input(container, "name")!, { target: { value: "Alice" } });
      fireEvent.change(input(container, "username")!, { target: { value: "alice" } });
      fireEvent.change(input(container, "email")!, { target: { value: "x@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() =>
        expect(screen.getByText("Network error")).toBeInTheDocument()
      );
    });

    it("disables submit button and shows loading text while submitting", async () => {
      let resolveResponse!: (r: Response) => void;
      vi.spyOn(globalThis, "fetch").mockReturnValue(
        new Promise<Response>((res) => {
          resolveResponse = res;
        })
      );

      const { container } = switchToRegister();

      fireEvent.change(input(container, "name")!, { target: { value: "Alice" } });
      fireEvent.change(input(container, "username")!, { target: { value: "alice" } });
      fireEvent.change(input(container, "email")!, { target: { value: "x@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Please wait…" })).toBeDisabled()
      );

      resolveResponse(jsonResponse({ message: "ok" }));
    });
  });

  describe("mode toggle clears errors", () => {
    it("clears error when switching modes", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ error: "Invalid credentials" }, 401)
      );

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "email")!, { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password")!, { target: { value: "wrong" } });
      fireEvent.click(screen.getByRole("button", { name: "Log in" }));

      await waitFor(() =>
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
      );

      fireEvent.click(
        screen.getByRole("button", { name: /create an account/i })
      );
      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });
  });
});
