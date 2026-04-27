"use client";
import { useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import styles from "./InlineEditField.module.css";

type Props = {
  label: string;
  value: boolean | null | undefined;
  onSave: (value: boolean | null) => Promise<string | null>;
  canEdit?: boolean;
};

const BOOL_OPTIONS = [true, false, null] as (boolean | null)[];

export default function InlineEditBooleanField({ label, value, onSave, canEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const displayText = value == null ? "-" : value ? "Yes" : "No";

  function startEdit() {
    setDraft(value ?? null);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
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
          <span className={styles.boolOptions}>
            {BOOL_OPTIONS.map((option) => (
              <Button
                key={String(option)}
                size="xs"
                variant={draft === option ? "primary" : "secondary"}
                onClick={() => setDraft(option)}
              >
                {option == null ? "Not set" : option ? "Yes" : "No"}
              </Button>
            ))}
          </span>
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
          <span>{displayText}</span>
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
