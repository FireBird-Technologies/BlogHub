import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Eye, Mail, Star } from "lucide-react";
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
  pending: "bg-gray-100 text-gray-500 border-gray-200",
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
  if (!email.author_approved) return { label: "Finalise announcement", needsAction: true };
  if (!email.admin_approved) return { label: "Awaiting our approval", needsAction: false };
  return { label: "Announcement scheduled", needsAction: false };
}

interface FeaturedSlotsMenuProps {
  bookings: MyBooking[];
  emails: FeaturedEmail[];
  onOpenEmail: (emailId: string) => void;
}

/** The featured status of a publication's card.
 *
 * A publication may hold several runs, each with its own announcement — so with more
 * than one booking this becomes a dropdown listing each run, its dates, its status,
 * and a way into its announcement. With exactly one it stays a plain pill plus an
 * envelope, which is the common case.
 */
export default function FeaturedSlotsMenu({
  bookings,
  emails,
  onOpenEmail,
}: FeaturedSlotsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // The card crops its image (`overflow-hidden`) and rounds its own corners with
  // another `overflow-hidden`, so an absolutely-positioned panel is clipped by both.
  // Render it in a portal on <body> instead, positioned against the trigger.
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const place = () => {
      const r = ref.current!.getBoundingClientRect();
      const width = 256; // w-64
      const left = Math.min(
        Math.max(8, r.right - width), // right-aligned to the trigger, clamped on-screen
        window.innerWidth - width - 8,
      );
      setCoords({ top: r.bottom + 6, left });
    };
    place();
    // Follow the trigger if the page moves under it.
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
      // The panel lives outside `ref` now (it's portalled), so check it separately.
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

  if (!bookings.length) return null;

  const sorted = sortBookings(bookings);
  const emailFor = (slotId: string) => emails.find((e) => e.slot_id === slotId);
  const anyNeedsAction = sorted.some((b) => emailHint(emailFor(b.id)).needsAction);

  // The common case: a single run. Pill + envelope, no dropdown.
  if (sorted.length === 1) {
    const b = sorted[0];
    const state = bookingState(b);
    const email = emailFor(b.id);
    const hint = emailHint(email);
    return (
      <div className="flex items-center gap-1.5">
        {/* Live visit counter — only meaningful while the run is actually running. */}
        {state === "active" && (
          <span
            title="Visits BlogHub has sent to this publication during its featured run"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/40
                       bg-black/50 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm"
          >
            <Eye size={9} />
            {b.click_count.toLocaleString()}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border
                      text-[10px] font-bold uppercase tracking-wide shadow-sm ${PILL_STYLES[state]}`}
        >
          {state === "active" && <Star size={9} fill="currentColor" />}
          {PILL_LABELS[state]}
        </span>
        {email && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEmail(email.id);
            }}
            title={hint.label}
            aria-label="Marketing email"
            className={`relative flex items-center justify-center w-6 h-6 rounded-full border shadow-sm
                        transition-colors ${
                          hint.needsAction
                            ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                            : "bg-white/90 text-gray-500 border-gray-200 hover:text-amber-700 hover:border-amber-300"
                        }`}
          >
            <Mail size={12} />
            {hint.needsAction && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Several runs on this publication — list them.
  const topState = bookingState(sorted[0]);
  const liveRun = sorted.find((b) => b.is_active);

  return (
    <div ref={ref} className="relative flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Live visit counter for whichever run is currently running. */}
      {liveRun && (
        <span
          title="Visits BlogHub has sent to this publication during its featured run"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/40
                     bg-black/50 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm"
        >
          <Eye size={9} />
          {liveRun.click_count.toLocaleString()}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border
                    text-[10px] font-bold uppercase tracking-wide shadow-sm transition-opacity
                    hover:opacity-90 ${PILL_STYLES[topState]}`}
      >
        {topState === "active" && <Star size={9} fill="currentColor" />}
        {sorted.length} featured runs
        <ChevronDown size={10} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
        {anyNeedsAction && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
        )}
      </button>

      {open &&
        ReactDOM.createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()}
            className="fixed w-64 z-50 rounded-xl border border-gray-200 bg-white shadow-lg
                       overflow-hidden"
          >
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 border-b border-gray-100">
              Featured runs
            </p>
          <ul className="list-none p-0 m-0 max-h-72 overflow-y-auto">
            {sorted.map((b) => {
              const state = bookingState(b);
              const email = emailFor(b.id);
              const hint = emailHint(email);
              return (
                <li key={b.id} className="border-b border-gray-50 last:border-0">
                  <div className="px-3 py-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        {formatDay(b.start_date)} – {formatDay(b.end_date)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border
                                    text-[9px] font-bold uppercase tracking-wide ${PILL_STYLES[state]}`}
                      >
                        {PILL_LABELS[state]}
                      </span>
                    </div>

                    {email ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onOpenEmail(email.id);
                        }}
                        className={`flex items-center gap-1.5 text-[11px] font-medium rounded-lg
                                    px-2 py-1 border transition-colors w-full ${
                                      hint.needsAction
                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                        : "bg-gray-50 text-gray-500 border-gray-200 hover:text-amber-700 hover:border-amber-300"
                                    }`}
                      >
                        <Mail size={11} />
                        {hint.label}
                        {hint.needsAction && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400">No announcement</span>
                    )}

                    {b.is_active && b.click_count > 0 && (
                      <span className="text-[10px] font-semibold text-amber-700">
                        {b.click_count.toLocaleString()} visits from BlogHub
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
