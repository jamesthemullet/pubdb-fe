"use client";

import { useEffect, useState } from "react";

type EditButtonProps = {
  pubName: string;
  onEdit: () => void;
  pubId: string;
};

type AuthUser = {
  email: string;
  approved?: boolean;
  admin?: boolean;
};

export default function EditButton({
  pubName,
  onEdit,
  pubId,
}: EditButtonProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({
            email: data.email,
            approved: data.approved,
            admin: data.admin,
          });
          return;
        }
      } catch {
        // Fall back to token decoding below when API check fails.
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          email: payload.email,
          approved: payload.approved,
          admin: payload.admin,
        });
      } catch {
        setUser(null);
      }
    };

    void checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  if (!user) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <a href="/register">Log in to edit this pub</a>
      </div>
    );
  }

  if (!user.approved) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <p>Your account is not approved for editing.</p>
        <p>
          Please email{" "}
          <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to request
          approval.
        </p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${pubName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/pubs/${pubId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete pub");
        return;
      }
      alert("Pub deleted successfully");
      window.location.href = "/pubs";
    } catch {
      alert("Network error");
    }
  };

  return (
    <div>
      <button onClick={onEdit}>Edit this pub</button>
      {user.admin && <button onClick={handleDelete}>Delete this pub</button>}
    </div>
  );
}
