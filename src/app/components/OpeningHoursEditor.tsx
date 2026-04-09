"use client";

import { useEffect, useState } from "react";
import Input from "@/app/components/input/Input";

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

  function update(day: string, next: Partial<DayHours>) {
    setHours((prev) => {
      const updated = {
        ...prev,
        [day]: { ...prev[day], ...next },
      };
      onChange(updated);
      return updated;
    });
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {DAYS.map((day) => {
        const d = hours[day];
        return (
          <div
            key={day}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div style={{ width: 90 }}>{day}</div>

            <Input
              type="time"
              value={d.open}
              disabled={d.closed}
              onChange={(e) => update(day, { open: e.target.value })}
            />

            <span>-</span>

            <Input
              type="time"
              value={d.close}
              disabled={d.closed}
              onChange={(e) => update(day, { close: e.target.value })}
            />

            <label htmlFor={`${day}-closed`} style={{ marginLeft: "0.5rem" }}>
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
