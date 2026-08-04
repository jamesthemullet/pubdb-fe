"use client";

import { useMemo, useState } from "react";
import type { SunScheduleEntry } from "@/types/pub";
import styles from "./SunScheduleDisplay.module.css";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function hourOf(time: string): number {
  return Number.parseInt(time.split(":")[0] ?? "0", 10);
}

type Props = {
  schedule: SunScheduleEntry[];
};

export default function SunScheduleDisplay({ schedule }: Props) {
  const months = useMemo(
    () =>
      Array.from(
        new Set(
          schedule
            .map((entry) => entry.month)
            .filter((month): month is number => month != null)
        )
      ).sort((a, b) => a - b),
    [schedule]
  );

  const [selectedMonth, setSelectedMonth] = useState<number | "all">(
    months.length > 0 ? months[0] : "all"
  );

  const hourMap = useMemo(() => {
    const map = new Map<number, SunScheduleEntry>();
    for (const entry of schedule) {
      if (entry.month == null) map.set(hourOf(entry.time), entry);
    }
    if (selectedMonth !== "all") {
      for (const entry of schedule) {
        if (entry.month === selectedMonth) map.set(hourOf(entry.time), entry);
      }
    }
    return map;
  }, [schedule, selectedMonth]);

  if (schedule.length === 0) return null;

  const maxPercent = Math.max(
    1,
    ...schedule.map((entry) => entry.percentInSun ?? 0)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Sun schedule</span>
        {months.length > 0 && (
          <select
            aria-label="Filter sun schedule by month"
            className={styles.monthSelect}
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {MONTH_NAMES[month - 1]}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className={styles.timeline}>
        {Array.from({ length: 24 }, (_, hour) => {
          const entry = hourMap.get(hour);
          const percent = entry?.percentInSun ?? 0;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: hour is a fixed, non-reordering 0-23 sequence
            <div key={hour} className={styles.cell}>
              <div className={styles.bar} title={`${hour}:00 · ${percent}% sun`}>
                {entry && (
                  <div
                    className={styles.barFill}
                    style={{ height: `${(percent / maxPercent) * 100}%` }}
                  />
                )}
              </div>
              {hour % 3 === 0 && (
                <span className={styles.hourLabel}>{hour}:00</span>
              )}
              {entry?.seats != null && (
                <span className={styles.seatsLabel}>{entry.seats}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
