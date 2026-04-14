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

// Labels in the form are not associated via `for`/`id`, so we query by name attribute.
function input(container: HTMLElement, name: string): HTMLInputElement {
  return container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
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

  describe("register mode (default)", () => {
    it("renders the register heading and all form fields", () => {
      const { container } = render(<RegisterLoginPage />);

      expect(screen.getByRole("heading", { name: "Register" })).toBeInTheDocument();
      expect(input(container, "name")).toBeInTheDocument();
      expect(input(container, "username")).toBeInTheDocument();
      expect(input(container, "email")).toBeInTheDocument();
      expect(input(container, "password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Register" })
      ).toBeInTheDocument();
    });

    it("shows toggle button to switch to login", () => {
      render(<RegisterLoginPage />);
      expect(
        screen.getByRole("button", { name: /already have an account/i })
      ).toBeInTheDocument();
    });

    it("does not show the forgot password link in register mode", () => {
      render(<RegisterLoginPage />);
      expect(screen.queryByText(/forgot your password/i)).not.toBeInTheDocument();
    });

    it("calls register API on submit and shows success message", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ message: "registered" })
      );

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "name"), { target: { value: "Alice" } });
      fireEvent.change(input(container, "username"), { target: { value: "alice123" } });
      fireEvent.change(input(container, "email"), { target: { value: "alice@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "secret" } });

      fireEvent.click(screen.getByRole("button", { name: "Register" }));

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

      expect(
        screen.getByText(/if you don't receive your verification email/i)
      ).toBeInTheDocument();
    });

    it("shows API error on failed registration", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ error: "Email already in use" }, 400)
      );

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "name"), { target: { value: "Alice" } });
      fireEvent.change(input(container, "username"), { target: { value: "alice" } });
      fireEvent.change(input(container, "email"), { target: { value: "taken@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(() =>
        expect(screen.getByText("Email already in use")).toBeInTheDocument()
      );
    });

    it("shows network error on fetch failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "name"), { target: { value: "Alice" } });
      fireEvent.change(input(container, "username"), { target: { value: "alice" } });
      fireEvent.change(input(container, "email"), { target: { value: "x@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Register" }));

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

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "name"), { target: { value: "Alice" } });
      fireEvent.change(input(container, "username"), { target: { value: "alice" } });
      fireEvent.change(input(container, "email"), { target: { value: "x@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled()
      );

      resolveResponse(jsonResponse({ message: "ok" }));
    });
  });

  describe("login mode", () => {
    function switchToLogin() {
      const result = render(<RegisterLoginPage />);
      fireEvent.click(
        screen.getByRole("button", { name: /already have an account/i })
      );
      return result;
    }

    it("switches to login mode and hides name/username fields", () => {
      const { container } = switchToLogin();

      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
      expect(input(container, "name")).toBeNull();
      expect(input(container, "username")).toBeNull();
      expect(input(container, "email")).toBeInTheDocument();
      expect(input(container, "password")).toBeInTheDocument();
    });

    it("shows forgot password link in login mode", () => {
      switchToLogin();
      expect(
        screen.getByRole("link", { name: /forgot your password/i })
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("shows toggle button to switch back to register", () => {
      switchToLogin();
      expect(
        screen.getByRole("button", { name: /need an account/i })
      ).toBeInTheDocument();
    });

    it("calls /api/auth/login, dispatches authChanged, and shows success", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({})
      );
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const { container } = switchToLogin();

      fireEvent.change(input(container, "email"), { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "mypassword" } });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() =>
        expect(screen.getByText("Login successful!")).toBeInTheDocument()
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST" })
      );
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    });

    it("shows API error on failed login", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ error: "Invalid credentials" }, 401)
      );

      const { container } = switchToLogin();

      fireEvent.change(input(container, "email"), { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "wrong" } });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() =>
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
      );
    });

    it("shows network error on fetch failure in login mode", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      const { container } = switchToLogin();

      fireEvent.change(input(container, "email"), { target: { value: "user@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "pw" } });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() =>
        expect(screen.getByText("Network error")).toBeInTheDocument()
      );
    });

    it("sends only email and password to login endpoint", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ token: "tok" })
      );

      const { container } = switchToLogin();

      fireEvent.change(input(container, "email"), { target: { value: "me@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "pass" } });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          body: JSON.stringify({ email: "me@example.com", password: "pass" }),
        })
      );
    });
  });

  describe("mode toggle clears errors", () => {
    it("clears error when switching modes", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({ error: "Email already in use" }, 400)
      );

      const { container } = render(<RegisterLoginPage />);

      fireEvent.change(input(container, "name"), { target: { value: "Alice" } });
      fireEvent.change(input(container, "username"), { target: { value: "alice" } });
      fireEvent.change(input(container, "email"), { target: { value: "taken@example.com" } });
      fireEvent.change(input(container, "password"), { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(() =>
        expect(screen.getByText("Email already in use")).toBeInTheDocument()
      );

      fireEvent.click(
        screen.getByRole("button", { name: /already have an account/i })
      );
      expect(screen.queryByText("Email already in use")).not.toBeInTheDocument();
    });
  });
});
