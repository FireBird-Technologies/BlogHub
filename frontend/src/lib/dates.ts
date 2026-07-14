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
