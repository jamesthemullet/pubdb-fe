import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EditButton from "./edit-button";

const pushMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("EditButton", () => {
  const renderAsApprovedAdmin = async () => {
    localStorage.setItem("token", "header.payload.signature");

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        email: "admin@example.com",
        approved: true,
        admin: true,
      }),
    } as Response);

    render(<EditButton pubName="The King" pubId="pub-1" onEdit={vi.fn()} />);

    const deleteButton = await screen.findByRole("button", {
      name: "Delete this pub",
    });

    return { deleteButton, fetchSpy };
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    pushMock.mockReset();
  });

  it("shows a register link when there is no token", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    render(<EditButton pubName="The King" pubId="pub-1" onEdit={vi.fn()} />);

    expect(
      screen.getByRole("link", { name: "Log in to edit this pub" })
    ).toHaveAttribute("href", "/register");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the approval message for unapproved users", async () => {
    localStorage.setItem("token", "header.payload.signature");
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        email: "user@example.com",
        approved: false,
        admin: false,
      }),
    } as Response);

    render(<EditButton pubName="The King" pubId="pub-1" onEdit={vi.fn()} />);

    expect(
      await screen.findByText("Your account is not approved for editing.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "hello@thepubdb.com" })
    ).toHaveAttribute("href", "mailto:hello@thepubdb.com");
  });

  it("falls back to decoding the token and allows approved admins to edit", async () => {
    const onEdit = vi.fn();
    const payload = btoa(
      JSON.stringify({
        email: "admin@example.com",
        approved: true,
        admin: true,
      })
    );

    localStorage.setItem("token", `header.${payload}.signature`);
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("API unavailable"));

    render(<EditButton pubName="The King" pubId="pub-1" onEdit={onEdit} />);

    const editButton = await screen.findByRole("button", {
      name: "Edit this pub",
    });

    expect(
      screen.getByRole("button", { name: "Delete this pub" })
    ).toBeInTheDocument();

    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("shows the register link when token decoding fails", async () => {
    localStorage.setItem("token", "header.invalid-json.signature");
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("API unavailable"));

    render(<EditButton pubName="The King" pubId="pub-1" onEdit={vi.fn()} />);

    expect(
      await screen.findByRole("link", { name: "Log in to edit this pub" })
    ).toHaveAttribute("href", "/register");
    expect(
      screen.queryByRole("button", { name: "Edit this pub" })
    ).not.toBeInTheDocument();
  });

  it("does not delete when confirmation is cancelled", async () => {
    const { deleteButton, fetchSpy } = await renderAsApprovedAdmin();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete "The King"? This action cannot be undone.'
      );
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("navigates to the pubs page after deleting a pub", async () => {
    const { deleteButton, fetchSpy } = await renderAsApprovedAdmin();

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        "/api/pubs/pub-1",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer header.payload.signature" },
        }
      );
    });
    expect(pushMock).toHaveBeenCalledWith("/pubs");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the API error message on the page when delete fails", async () => {
    const { deleteButton, fetchSpy } = await renderAsApprovedAdmin();

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Deletion failed" }),
    } as Response);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    fireEvent.click(deleteButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Deletion failed"
    );
  });

  it("shows the fallback API error message when delete fails without an error payload", async () => {
    const { deleteButton, fetchSpy } = await renderAsApprovedAdmin();

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    fireEvent.click(deleteButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to delete pub"
    );
  });

  it("shows a network error on the page when delete throws", async () => {
    const { deleteButton, fetchSpy } = await renderAsApprovedAdmin();

    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    vi.spyOn(window, "confirm").mockReturnValue(true);

    fireEvent.click(deleteButton);

    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
  });
});
