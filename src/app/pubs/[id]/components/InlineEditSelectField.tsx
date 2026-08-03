"use client";
import { useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import styles from "./InlineEditField.module.css";

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string | null | undefined;
  options: Option[];
  emptyLabel?: string;
  onSave: (value: string | null) => Promise<string | null>;
  canEdit?: boolean;
  rowLayout?: boolean;
};

export default function InlineEditSelectField({
  label,
  value,
  options,
  emptyLabel = "Unknown",
  onSave,
  canEdit,
  rowLayout,
}: Props): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const displayText = options.find((o) => o.value === value)?.label ?? emptyLabel;

  function startEdit() {
    setDraft(value ?? "");
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save(): Promise<void> {
    setSaving(true);
    const err = await onSave(draft || null);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setEditing(false);
    }
  }

  const editControls = editing ? (
    <span className={styles.editWrapper}>
      <select
        className={styles.selectInput}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-label={label}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <Button size="xs" onClick={() => void save()} disabled={saving} aria-label={`Save ${label}`}>✓</Button>
      <Button size="xs" variant="secondary" onClick={cancel} disabled={saving} aria-label="Cancel">✗</Button>
      {error && <Typography as="span" className={styles.inlineError}>{error}</Typography>}
    </span>
  ) : (
    <span className={`${styles.valueWrapper} ${styles.field}`}>
      <span>{displayText}</span>
      {canEdit && (
        <Button variant="ghost" size="xs" className={styles.editLink} onClick={startEdit} aria-label={`Edit ${label}`}>
          edit
        </Button>
      )}
    </span>
  );

  if (rowLayout) {
    return (
      <div className={styles.row}>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowValue}>{editControls}</span>
      </div>
    );
  }

  return (
    <Typography className={styles.field}>
      <Typography as="span" isBold>{label}:</Typography>{" "}
      {editControls}
    </Typography>
  );
}
