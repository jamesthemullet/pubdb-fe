"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import Textarea from "@/app/components/textarea/Textarea";
import Typography from "@/app/components/typography/typography";
import styles from "./InlineEditField.module.css";

type Props = {
  label: string;
  displayValue: ReactNode;
  initialValue: string;
  type?: "text" | "textarea" | "url" | "number";
  onSave: (value: string) => Promise<string | null>;
  validate?: (value: string) => string | null;
  canEdit?: boolean;
};

export default function InlineEditField({
  label,
  displayValue,
  initialValue,
  type = "text",
  onSave,
  validate,
  canEdit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(initialValue);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    if (validate) {
      const err = validate(draft);
      if (err) {
        setError(err);
        return;
      }
    }
    setSaving(true);
    const err = await onSave(draft);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setEditing(false);
    }
  }

  return (
    <Typography className={styles.field}>
      <Typography as="span" isBold>
        {label}:
      </Typography>{" "}
      {editing ? (
        <span className={styles.editWrapper}>
          {type === "textarea" ? (
            <Textarea
              fullWidth={false}
              className={styles.inlineTextarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
              }}
            />
          ) : (
            <Input
              fullWidth={false}
              className={styles.inlineInput}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
                if (e.key === "Escape") cancel();
              }}
            />
          )}
          <Button size="xs" onClick={() => void save()} disabled={saving} aria-label={`Save ${label}`}>
            ✓
          </Button>
          <Button size="xs" variant="secondary" onClick={cancel} disabled={saving} aria-label="Cancel">
            ✗
          </Button>
          {error && (
            <Typography as="span" className={styles.inlineError}>
              {error}
            </Typography>
          )}
        </span>
      ) : (
        <span className={styles.valueWrapper}>
          <span>{displayValue}</span>
          {canEdit && (
            <Button
              variant="ghost"
              size="xs"
              className={styles.editLink}
              onClick={startEdit}
              aria-label={`Edit ${label}`}
            >
              edit
            </Button>
          )}
        </span>
      )}
    </Typography>
  );
}
