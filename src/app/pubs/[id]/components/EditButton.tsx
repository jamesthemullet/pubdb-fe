import { useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import type { AuthUser } from "@/hooks/useAuth";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "../page.module.css";

type Props = {
  pubName: string;
  pubId: string;
  user: AuthUser;
  onEdit: () => void;
};

export default function EditButton({ pubName, pubId, user, onEdit }: Props): React.JSX.Element {
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      const res = await fetch(`/api/pubs/${pubId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      if (!res.ok) {
        const data: unknown = await res.json();
        const errMsg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to delete pub";
        setDeleteMessage({ type: "error", text: errMsg });
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
      <Button size="sm" onClick={onEdit}>Edit this pub</Button>
      {user?.admin && (
        <Button variant="red" onClick={handleDelete}>
          Delete this pub
        </Button>
      )}
    </div>
  );
}
