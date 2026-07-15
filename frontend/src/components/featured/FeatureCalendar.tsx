import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  daysInMonth,
  isSameDay,
  mondayFirstOffset,
  monthLabel,
  startOfMonth,
  toISODate,
} from "../../lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface FeatureCalendarProps {
  /** Days already reserved by a paid booking or a live hold. */
  bookedDays: Set<string>;
  durationDays: number;
  minDate: Date;
  maxDate: Date;
  selectedStart: Date | null;
  onSelectStart: (d: Date) => void;
}

/** Month grid for picking the start of a featured run. Booked days are disabled.
 *
 * A day is only a valid start if the *whole* run fits into free days within the
 * booking horizon — so the user can never assemble a range that straddles someone
 * else's booking.
 */
export default function FeatureCalendar({
  bookedDays,
  durationDays,
  minDate,
  maxDate,
  selectedStart,
  onSelectStart,
}: FeatureCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedStart ?? minDate));
  const [hoverStart, setHoverStart] = useState<Date | null>(null);

  const isValidStart = useMemo(
    () => (d: Date) => {
      if (d < minDate) return false;
      for (let i = 0; i < durationDays; i++) {
        const day = addDays(d, i);
        if (day > maxDate) return false;
        if (bookedDays.has(toISODate(day))) return false;
      }
      return true;
    },
    [bookedDays, durationDays, minDate, maxDate],
  );

  /** Days painted as part of the selected (or hovered) run. */
  const bandDays = useMemo(() => {
    const anchor = selectedStart ?? hoverStart;
    if (!anchor) return new Set<string>();
    const set = new Set<string>();
    for (let i = 0; i < durationDays; i++) set.add(toISODate(addDays(anchor, i)));
    return set;
  }, [selectedStart, hoverStart, durationDays]);

  const canGoBack = startOfMonth(viewMonth) > startOfMonth(minDate);
  const canGoForward = startOfMonth(viewMonth) < startOfMonth(maxDate);

  const cells: (Date | null)[] = [
    ...Array<null>(mondayFirstOffset(viewMonth)).fill(null),
    ...Array.from(
      { length: daysInMonth(viewMonth) },
      (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1),
    ),
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="p-1.5 rounded-lg text-gray-500 transition-colors hover:bg-gray-100
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthLabel(viewMonth)}</span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className="p-1.5 rounded-lg text-gray-500 transition-colors hover:bg-gray-100
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setHoverStart(null)}>
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;

          const key = toISODate(day);
          const booked = bookedDays.has(key);
          const outOfRange = day < minDate || day > maxDate;
          const validStart = isValidStart(day);
          const inBand = bandDays.has(key);
          const isBandStart = Boolean(selectedStart && isSameDay(day, selectedStart));
          const isBandEnd =
            (selectedStart ?? hoverStart) != null &&
            isSameDay(day, addDays((selectedStart ?? hoverStart)!, durationDays - 1));

          let title: string | undefined;
          if (booked) title = "Already booked";
          else if (outOfRange) title = "Outside the booking window";
          else if (!validStart) title = `Not enough consecutive free days for a ${durationDays}-day run`;

          let tone: string;
          if (inBand && !booked) {
            tone = "bg-red-600 text-white font-semibold";
          } else if (booked) {
            tone = "bg-gray-100 text-gray-400 line-through";
          } else if (outOfRange || !validStart) {
            tone = "text-gray-300";
          } else {
            tone = "text-gray-700 hover:bg-red-50 hover:text-red-700";
          }

          const rounded = inBand
            ? `${isBandStart ? "rounded-l-lg" : ""} ${isBandEnd ? "rounded-r-lg" : ""} ${
                !isBandStart && !isBandEnd ? "rounded-none" : ""
              }`
            : "rounded-lg";

          return (
            <button
              key={key}
              type="button"
              disabled={!validStart}
              title={title}
              onClick={() => onSelectStart(day)}
              onMouseEnter={() => validStart && setHoverStart(day)}
              className={`h-9 text-sm transition-colors disabled:cursor-not-allowed ${tone} ${rounded}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-gray-200 bg-white" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-600" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Booked
        </span>
      </div>
    </div>
  );
}
