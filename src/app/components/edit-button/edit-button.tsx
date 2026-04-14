"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../button/button";
import Typography from "../typography/typography";
import styles from "./edit-button.module.css";

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

const EditButton = ({ pubName, onEdit, pubId }: EditButtonProps) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser({
            email: data.email,
            approved: data.approved,
            admin: data.admin,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    void checkAuth();
    window.addEventListener("authChanged", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
    };
  }, []);

  if (!user) {
    return (
      <div className={styles.notice}>
        <Link href="/register">Log in to edit this pub</Link>
      </div>
    );
  }

  if (!user.approved) {
    return (
      <div className={styles.notice}>
        <Typography>Your account is not approved for editing.</Typography>
        <Typography>
          Please email{" "}
          <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to request
          approval.
        </Typography>
      </div>
    );
  }

  const handleDelete = async () => {
    setDeleteError(null);

    if (
      !confirm(
        `Are you sure you want to delete "${pubName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/pubs/${pubId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete pub");
        return;
      }
      router.push("/pubs");
    } catch {
      setDeleteError("Network error");
    }
  };

  return (
    <div>
      <Button onClick={onEdit}>Edit this pub</Button>
      {user.admin && (
        <Button variant="red" onClick={handleDelete}>
          Delete this pub
        </Button>
      )}
      {deleteError && (
        <Typography
          as="p"
          variant="bodySmall"
          className={styles.errorMessage}
          role="alert"
        >
          {deleteError}
        </Typography>
      )}
    </div>
  );
};

export default EditButton;
