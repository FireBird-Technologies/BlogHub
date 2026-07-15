/** Calendar-day helpers for the featured-slot booking calendar.
 *
 * Everything here works in *local* time on purpose. A booked day is a calendar
 * day, not an instant, so we deliberately avoid `toISOString()` (which converts to
 * UTC and reports the previous day for anyone west of Greenwich) and the
 * `new Date("2026-07-13")` string form (which parses as UTC midnight and renders
 * as the 12th in the Americas).
 */

import type { BookedRange } from "../types/models";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Local calendar day as `YYYY-MM-DD`. */
export function toISODate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Parse `YYYY-MM-DD` as local midnight. */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Strip the time component, so comparisons are day-to-day. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function monthLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Weekday index of the 1st, with Monday as column 0. */
export function mondayFirstOffset(d: Date): number {
  return (startOfMonth(d).getDay() + 6) % 7;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

/** e.g. "13 Jul – 19 Jul 2026" */
export function formatRange(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

/** Every day covered by a range, as `YYYY-MM-DD` strings (both ends inclusive). */
export function expandRange(start: string, end: string): string[] {
  const days: string[] = [];
  const last = parseISODate(end);
  for (let d = parseISODate(start); d <= last; d = addDays(d, 1)) {
    days.push(toISODate(d));
  }
  return days;
}

/** Flatten booked ranges into a lookup of unavailable days. */
export function buildBookedSet(booked: BookedRange[]): Set<string> {
  const set = new Set<string>();
  for (const range of booked) {
    for (const day of expandRange(range.start_date, range.end_date)) set.add(day);
  }
  return set;
}

/* ------------------------------------------------------------------------- *
 * Send times are INSTANTS, not calendar days.
 *
 * Everything above deals in calendar days and deliberately never touches
 * `toISOString()`, because converting a day to UTC shifts it for anyone west of
 * Greenwich. The announcement send time is the opposite kind of value: it is one
 * moment in time, the same moment for every subscriber. For that, `toISOString()`
 * is exactly the right conversion. Don't cross the two.
 * ------------------------------------------------------------------------- */

/** The viewer's IANA timezone, e.g. "Asia/Karachi". */
export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** A local calendar day + hour -> the UTC instant it refers to.
 *
 * Building a Date from local parts and serialising it with `toISOString()` *is* the
 * local→UTC conversion, and it gets DST right for free, because the browser applies
 * its own zone rules. 9 PM in Karachi becomes 16:00Z.
 */
export function localDateHourToUtcISO(day: string, hour: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, hour, 0, 0, 0).toISOString();
}

/** Render a stored UTC instant in the zone the author chose it in.
 *
 * Falls back to the viewer's own zone when we have no stored zone (bookings made
 * before the send-time picker existed).
 */
export function formatInZone(utcISO: string, zone?: string | null): string {
  return new Date(utcISO).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone || undefined,
  });
}

/** The hour-of-day of a UTC instant, as seen in the given zone (0–23). */
export function hourInZone(utcISO: string, zone?: string | null): number {
  const s = new Date(utcISO).toLocaleString("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: zone || undefined,
  });
  return Number(s.slice(0, 2));
}

/** The calendar day (YYYY-MM-DD) of a UTC instant, as seen in the given zone. */
export function dayInZone(utcISO: string, zone?: string | null): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the shape we want.
  return new Date(utcISO).toLocaleDateString("en-CA", { timeZone: zone || undefined });
}

/** "9:00 PM" for an hour 0–23. */
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${suffix}`;
}
