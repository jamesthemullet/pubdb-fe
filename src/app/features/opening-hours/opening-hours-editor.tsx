"use client";

import { useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import styles from "./opening-hours-editor.module.css";
import { parseGoogleHours } from "./parse-google-hours";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type OpeningHours = Record<string, DayHours>;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function OpeningHoursEditor({
  value,
  onChange,
}: {
  value?: Partial<Record<string, Partial<DayHours>>> | null;
  onChange: (val: OpeningHours) => void;
}) {
  const [hours, setHours] = useState<OpeningHours>(() =>
    Object.fromEntries(
      DAYS.map((day) => [
        day,
        {
          open: value?.[day]?.open ?? "",
          close: value?.[day]?.close ?? "",
          closed: value?.[day]?.closed ?? false,
        },
      ])
    )
  );

  useEffect(() => {
    if (!value) return;
    setHours(
      Object.fromEntries(
        DAYS.map((day) => [
          day,
          {
            open: value[day]?.open ?? "",
            close: value[day]?.close ?? "",
            closed: value[day]?.closed ?? false,
          },
        ])
      )
    );
  }, [value]);

  const update = (day: string, next: Partial<DayHours>) => {
    setHours((prev) => {
      const updated = {
        ...prev,
        [day]: { ...prev[day], ...next },
      };
      onChange(updated);
      return updated;
    });
  };

  const [googlePaste, setGooglePaste] = useState("");
  const [googlePasteError, setGooglePasteError] = useState(false);

  const applyGooglePaste = () => {
    const parsed = parseGoogleHours(googlePaste);
    if (!parsed) {
      setGooglePasteError(true);
      return;
    }
    setGooglePasteError(false);
    setHours(parsed);
    onChange(parsed);
    setGooglePaste("");
  };

  const [bulkOpen, setBulkOpen] = useState("");
  const [bulkClose, setBulkClose] = useState("");

  const applyToAll = () => {
    setHours((prev) => {
      const updated = Object.fromEntries(
        DAYS.map((day) => [
          day,
          prev[day].closed
            ? prev[day]
            : { ...prev[day], open: bulkOpen, close: bulkClose },
        ])
      );
      onChange(updated);
      return updated;
    });
  };

  return (
    <div className={styles.grid}>
      <div className={styles.pasteRow}>
        <Typography className={styles.pasteLabel}>
          Paste from Google Maps
        </Typography>
        <textarea
          className={styles.pasteTextarea}
          value={googlePaste}
          onChange={(e) => {
            setGooglePaste(e.target.value);
            setGooglePasteError(false);
          }}
          placeholder={"Monday\n9 am–11 pm\n\nTuesday\n9 am–11 pm"}
          rows={4}
          aria-label="Paste opening hours from Google"
        />
        {googlePasteError && (
          <Typography className={styles.pasteError}>
            Could not parse the pasted text. Please check the format (copy the
            block directly from Google Maps) and try again.
          </Typography>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={applyGooglePaste}
          className={styles.applyButton}
        >
          Apply from Google
        </Button>
      </div>
      <div className={styles.bulkRow}>
        <Typography className={styles.dayLabel}>Apply to all</Typography>
        <Input
          type="time"
          value={bulkOpen}
          onChange={(e) => setBulkOpen(e.target.value)}
          className={styles.timeInput}
        />
        <Typography as="span">-</Typography>
        <Input
          type="time"
          value={bulkClose}
          onChange={(e) => setBulkClose(e.target.value)}
          className={styles.timeInput}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={applyToAll}
          className={styles.applyButton}
        >
          Apply
        </Button>
      </div>
      {DAYS.map((day) => {
        const d = hours[day];
        return (
          <div key={day} className={styles.row}>
            <div className={styles.dayLabel}>{day}</div>

            <Input
              type="time"
              value={d.open}
              disabled={d.closed}
              onChange={(e) => update(day, { open: e.target.value })}
              className={styles.timeInput}
            />

            <Typography as="span">-</Typography>

            <Input
              type="time"
              value={d.close}
              disabled={d.closed}
              onChange={(e) => update(day, { close: e.target.value })}
              className={styles.timeInput}
            />

            <label htmlFor={`${day}-closed`} className={styles.closedLabel}>
              <Input
                id={`${day}-closed`}
                type="checkbox"
                checked={d.closed}
                onChange={(e) =>
                  update(day, {
                    closed: e.target.checked,
                    open: "",
                    close: "",
                  })
                }
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}
