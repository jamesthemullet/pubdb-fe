import { useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "../page.module.css";

type Props = {
  pubName: string;
  pubId: string;
  onEdit: () => void;
};

export default function EditButton({ pubName, pubId, onEdit }: Props) {
  const [user, setUser] = useState<{
    email: string;
    approved?: boolean;
    admin?: boolean;
  } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser({ email: data.email, approved: data.approved, admin: data.admin });
          return;
        }
      } catch {
        // Fall through to token decoding fallback.
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
      <div className={styles.editButtonMessage}>
        <a href="/register">Log in to edit this pub</a>
      </div>
    );
  }
  if (!user.approved) {
    return (
      <div className={styles.editButtonMessage}>
        <Typography>Your account is not approved for editing.</Typography>
        <Typography>
          Please email{" "}
          <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to request
          approval.
        </Typography>
      </div>
    );
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${pubName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/pubs/${pubId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteMessage({
          type: "error",
          text: data.error || "Failed to delete pub",
        });
      } else {
        setDeleteMessage({ type: "success", text: "Pub deleted successfully" });
        window.location.href = "/pubs";
      }
    } catch (_err) {
      setDeleteMessage({ type: "error", text: "Network error" });
    }
  }

  return (
    <div>
      {deleteMessage && (
        <Typography
          className={
            deleteMessage.type === "success"
              ? styles.deleteMessageSuccess
              : styles.deleteMessageError
          }
        >
          {deleteMessage.text}
        </Typography>
      )}
      <Button onClick={onEdit}>Edit this pub</Button>
      {user?.admin && (
        <Button variant="red" onClick={handleDelete}>
          Delete this pub
        </Button>
      )}
    </div>
  );
}
