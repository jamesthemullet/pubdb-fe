"use client";

import { useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import styles from "./opening-hours-editor.module.css";

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
    setHours((_prev) =>
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
