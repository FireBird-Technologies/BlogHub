import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { BarChart3, ChevronDown, Mail, Star } from "lucide-react";
import type { FeaturedEmail, MyBooking } from "../../types/models";

export type FeaturedPillState = "active" | "scheduled" | "pending";

export const PILL_LABELS: Record<FeaturedPillState, string> = {
  active: "Featured",
  scheduled: "Featured scheduled",
  pending: "Pending review",
};

export const PILL_STYLES: Record<FeaturedPillState, string> = {
  active: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-transparent",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-orange-50 text-orange-700 border-orange-200",
};

export function bookingState(b: MyBooking): FeaturedPillState {
  if (b.is_active) return "active";
  if (b.approval_status === "approved") return "scheduled";
  return "pending";
}

/** Sort order: the one needing attention first, then live, then upcoming. */
const ORDER: Record<FeaturedPillState, number> = { pending: 0, active: 1, scheduled: 2 };

export function sortBookings(bookings: MyBooking[]): MyBooking[] {
  return [...bookings].sort(
    (a, b) => ORDER[bookingState(a)] - ORDER[bookingState(b)] || a.start_date.localeCompare(b.start_date),
  );
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** What the author still has to do with an announcement, if anything. */
function emailHint(email: FeaturedEmail | undefined): { label: string; needsAction: boolean } {
  if (!email) return { label: "No announcement", needsAction: false };
  if (email.status === "sent") return { label: "Announcement sent", needsAction: false };
  if (email.status === "sending") return { label: "Announcement sending…", needsAction: false };
  if (!email.author_approved) return { label: "Finalise announcement", needsAction: true };
  if (!email.admin_approved) return { label: "Awaiting our approval", needsAction: false };
  return { label: "Announcement scheduled", needsAction: false };
}

/** A round icon button that, on click, opens a small portalled panel anchored below
 *  it. Used for both the mail and analytics triggers when a publication has more
 *  than one run — each run needs its own row, so a single icon isn't enough.
 */
function IconDropdown({
  icon,
  label,
  needsAction,
  panel,
  triggerClassName,
  panelTitle,
}: {
  icon: ReactNode;
  label: string;
  needsAction?: boolean;
  panel: ReactNode;
  /** Overrides the default sky/amber pill styling for the trigger button. */
  triggerClassName?: string;
  /** Heading shown at the top of the dropdown panel (defaults to `label`). */
  panelTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // The card crops its image (`overflow-hidden`) and rounds its own corners with
  // another `overflow-hidden`, so an absolutely-positioned panel is clipped by both.
  // Render it in a portal on <body> instead, positioned against the trigger.
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const place = () => {
      const r = ref.current!.getBoundingClientRect();
      const width = 224; // w-56
      const left = Math.min(
        Math.max(8, r.right - width),
        window.innerWidth - width - 8,
      );
      setCoords({ top: r.bottom + 6, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title={label}
        aria-label={label}
        className={
          triggerClassName ??
          `relative flex items-center gap-0.5 px-1.5 h-5 rounded-full border shadow-sm
           text-[10px] font-medium transition-colors ${
             needsAction
               ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
               : "bg-sky-50 border-sky-200 text-sky-700 hover:border-sky-300 hover:bg-sky-100"
           }`
        }
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        {needsAction && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
        )}
      </button>

      {open &&
        ReactDOM.createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()}
            className="fixed w-56 z-50 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
          >
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 border-b border-gray-100">
              {panelTitle ?? label}
            </p>
            <ul className="list-none p-0 m-0 max-h-72 overflow-y-auto">{panel}</ul>
          </div>,
          document.body,
        )}
    </>
  );
}

interface FeaturedSlotsMenuProps {
  bookings: MyBooking[];
  emails: FeaturedEmail[];
  onOpenEmail: (emailId: string) => void;
  /** Opens the analytics modal for a given run (views, upvotes, comments). */
  onOpenAnalytics: (booking: MyBooking) => void;
}

/** The featured status of a publication's card: a status pill, plus separate icon
 *  buttons for its announcement email and its analytics.
 *
 * A publication may hold several runs at once (e.g. one live, one pending review) —
 * in that case each icon becomes its own dropdown listing every run by date range,
 * so the right row can be picked directly rather than guessing which run "the"
 * icon refers to. With exactly one run, each icon acts on that run directly.
 */
export default function FeaturedSlotsMenu({
  bookings,
  emails,
  onOpenEmail,
  onOpenAnalytics,
}: FeaturedSlotsMenuProps) {
  if (!bookings.length) return null;

  const sorted = sortBookings(bookings);
  const emailFor = (slotId: string) => emails.find((e) => e.slot_id === slotId);
  const anyNeedsAction = sorted.some((b) => emailHint(emailFor(b.id)).needsAction);
  const topState = bookingState(sorted[0]);

  const single = sorted.length === 1;
  const b0 = sorted[0];
  const email0 = emailFor(b0.id);
  const hint0 = emailHint(email0);

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {single ? (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border
                      text-[10px] font-bold uppercase tracking-wide shadow-sm ${PILL_STYLES[topState]}`}
        >
          {topState === "active" && <Star size={9} fill="currentColor" />}
          {PILL_LABELS[topState]}
        </span>
      ) : (
        <IconDropdown
          icon={topState === "active" ? <Star size={9} fill="currentColor" /> : null}
          label={`${sorted.length} featured runs`}
          panelTitle="Featured runs"
          triggerClassName={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border
                             text-[10px] font-bold uppercase tracking-wide shadow-sm ${PILL_STYLES[topState]}`}
          panel={sorted.map((b) => (
            <li key={b.id} className="border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700">
                <span className="flex-1">
                  {formatDay(b.start_date)} – {formatDay(b.end_date)}
                </span>
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 rounded-full border text-[9px] font-bold
                              uppercase tracking-wide ${PILL_STYLES[bookingState(b)]}`}
                >
                  {PILL_LABELS[bookingState(b)]}
                </span>
              </div>
            </li>
          ))}
        />
      )}

      {/* Analytics — its own circle, its own dropdown when there's more than one run. */}
      {single ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAnalytics(b0);
          }}
          title="View analytics"
          aria-label="View analytics"
          className="flex items-center gap-0.5 px-1.5 h-5 rounded-full border border-sky-200
                     shadow-sm bg-sky-50 text-[10px] font-medium text-sky-700 transition-colors
                     hover:border-sky-300 hover:bg-sky-100"
        >
          <BarChart3 size={11} />
          <span>Analytics</span>
        </button>
      ) : (
        <IconDropdown
          icon={<BarChart3 size={11} />}
          label="Analytics"
          panel={sorted.map((b) => (
            <li key={b.id} className="border-b border-gray-50 last:border-0">
              <button
                type="button"
                onClick={() => onOpenAnalytics(b)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs
                           text-gray-700 hover:bg-amber-50 transition-colors"
              >
                <BarChart3 size={12} className="flex-shrink-0 text-amber-600" />
                <span className="flex-1">
                  {formatDay(b.start_date)} – {formatDay(b.end_date)}
                </span>
              </button>
            </li>
          ))}
        />
      )}

      {/* Announcement email — same pattern. */}
      {single ? (
        email0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEmail(email0.id);
            }}
            title={hint0.label}
            aria-label="Marketing email"
            className={`relative flex items-center gap-0.5 px-1.5 h-5 rounded-full border shadow-sm
                        text-[10px] font-medium transition-colors ${
                          hint0.needsAction
                            ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
                            : "bg-sky-50 border-sky-200 text-sky-700 hover:border-sky-300 hover:bg-sky-100"
                        }`}
          >
            <Mail size={11} />
            <span>Email</span>
            {hint0.needsAction && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
            )}
          </button>
        )
      ) : (
        <IconDropdown
          icon={<Mail size={11} />}
          label="Email"
          needsAction={anyNeedsAction}
          panel={sorted.map((b) => {
            const email = emailFor(b.id);
            const hint = emailHint(email);
            return (
              <li key={b.id} className="border-b border-gray-50 last:border-0">
                <button
                  type="button"
                  disabled={!email}
                  onClick={() => email && onOpenEmail(email.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs
                             text-gray-700 transition-colors enabled:hover:bg-amber-50 disabled:opacity-50"
                >
                  <Mail
                    size={12}
                    className={`flex-shrink-0 ${hint.needsAction ? "text-amber-600" : "text-gray-400"}`}
                  />
                  <span className="flex-1 min-w-0 truncate">
                    {formatDay(b.start_date)} – {formatDay(b.end_date)}
                  </span>
                  {hint.needsAction && (
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              </li>
            );
          })}
        />
      )}
    </div>
  );
}
