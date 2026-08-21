import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { CalendarDays } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import FeatureCalendar from "./FeatureCalendar";
import AnnouncementStep, {
  draftSendAtUtc,
  type AnnouncementDraft,
} from "./AnnouncementStep";
import { useCreateFeatureCheckout, useFeatureAvailability, useRenewalContext } from "../../hooks/useFeatured";
import { formatApiErrorDetail } from "../../lib/api";
import {
  addDays,
  buildBookedSet,
  dayInZone,
  formatRange,
  hourInZone,
  localZone,
  parseISODate,
  toISODate,
} from "../../lib/dates";
import { FEATURE_DURATIONS, type FeatureDuration } from "../../lib/featuredCheckout";

type Step = "dates" | "announcement";

interface RenewFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The booking being renewed — from the `?renew=` deep link in the expiry email. */
  slotId: string | null;
}

function priceLabel(prices: Record<string, number>, days: number): string {
  const cents = prices[String(days)];
  return cents == null ? "" : `$${Math.round(cents / 100)}`;
}

/** Renew a finished featured run.
 *
 * Deliberately not the 3-step `FeaturePublicationModal`: the publication is already
 * decided here, so its "which publication?" step has nothing to ask. What replaces it
 * is a duration-first flow — MIN_LEAD_DAYS means a renewal can never butt up against a
 * run ending today, so rather than drop the author on a calendar to hunt for a gap, we
 * pick the earliest window that fits and let them change it.
 */
export default function RenewFeatureModal({ isOpen, onClose, slotId }: RenewFeatureModalProps) {
  const renewal = useRenewalContext(isOpen ? slotId : null);
  const availability = useFeatureAvailability(isOpen);
  const checkout = useCreateFeatureCheckout();

  const [step, setStep] = useState<Step>("dates");
  const [duration, setDuration] = useState<FeatureDuration>(7);
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  // The calendar is always on screen, so this tracks whether the author has overridden
  // the suggested start rather than whether the calendar is visible.
  const [pickedManually, setPickedManually] = useState(false);
  const [draft, setDraft] = useState<AnnouncementDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset every time the modal opens, so a second renewal in the same session doesn't
  // inherit the previous one's dates or edits.
  useEffect(() => {
    if (!isOpen) return;
    setStep("dates");
    setDuration(7);
    setSelectedStart(null);
    setPickedManually(false);
    setDraft(null);
    setError(null);
  }, [isOpen, slotId]);

  const data = renewal.data;

  // Default to the earliest free window for the chosen duration — but never overwrite a
  // day the author picked themselves.
  useEffect(() => {
    if (!data || pickedManually) return;
    const next = data.next_available[String(duration)];
    setSelectedStart(next ? parseISODate(next) : null);
  }, [data, duration, pickedManually]);

  const bookedDays = useMemo(
    () => buildBookedSet(availability.data?.booked ?? []),
    [availability.data],
  );

  const endDate = selectedStart ? addDays(selectedStart, duration - 1) : null;

  const handleContinue = () => {
    if (!data || !selectedStart || !endDate) return;
    // Seed the announcement with what they sent last time, and default the send time to
    // 9am on day 2 of the new run — the same shape the compose endpoint suggests.
    const suggested = new Date(addDays(selectedStart, 1));
    suggested.setHours(9, 0, 0, 0);
    const iso = suggested.toISOString();
    setDraft({
      subject: data.email_subject,
      body: data.email_body,
      buttonText: data.email_button_text,
      day: dayInZone(iso),
      hour: hourInZone(iso),
    });
    setStep("announcement");
  };

  const handlePay = () => {
    if (!data || !selectedStart || !draft) return;
    setError(null);
    checkout.mutate(
      {
        publication_id: data.publication_id,
        start_date: toISODate(selectedStart),
        duration_days: duration,
        email_subject: draft.subject.trim(),
        email_body: draft.body.trim(),
        email_button_text: draft.buttonText.trim(),
        email_scheduled_at: draftSendAtUtc(draft),
        email_timezone: localZone(),
        // Unlocks the shorter renewal lead time, so extending a run that ends today
        // can start tomorrow. Re-verified server-side against this slot's owner.
        ...(slotId ? { renewal_of_slot_id: slotId } : {}),
      },
      {
        onError: (err) => {
          setError(formatApiErrorDetail(err, "Could not start checkout. Please try again."));
          // Someone took these dates while the modal was open — repaint and go back.
          if (isAxiosError(err) && err.response?.status === 409) {
            setStep("dates");
            setSelectedStart(null);
            // Drop back to a fresh suggestion — the day they picked is now taken.
            setPickedManually(false);
            availability.refetch();
            renewal.refetch();
          }
        },
      },
    );
  };

  const sendTimeValid = draft ? new Date(draftSendAtUtc(draft)).getTime() > Date.now() : false;
  const canPay = Boolean(
    draft?.subject.trim() && draft?.body.trim() && draft?.buttonText.trim() && sendTimeValid,
  );

  const isLoading = renewal.isLoading || availability.isLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Extend your feature" maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        )}

        {!isLoading && (renewal.isError || availability.isError) && (
          <p className="text-sm text-gray-500 py-8 text-center">
            {renewal.isError
              ? formatApiErrorDetail(renewal.error, "Could not load this booking.")
              : "Could not load availability. Please close and try again."}
          </p>
        )}

        {data && availability.data && (
          <>
            {/* What's being renewed — fixed, not a choice. */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              {data.publication_image_url && (
                <img
                  src={data.publication_image_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {data.publication_title}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <CalendarDays size={12} className="shrink-0" />
                  {formatRange(
                    parseISODate(data.previous_start_date),
                    parseISODate(data.previous_end_date),
                  )}
                </p>
              </div>
            </div>

            {step === "dates" && (
              <>
                <p className="text-sm text-gray-500">
                  Choose how long you'd like to run for. We've picked the earliest dates
                  available — you can change them.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {FEATURE_DURATIONS.map((days) => {
                    const available = data.next_available[String(days)];
                    const selected = days === duration;
                    return (
                      <button
                        key={days}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          setDuration(days);
                          // A new length needs a fresh suggestion — the old start may
                          // no longer fit.
                          setPickedManually(false);
                        }}
                        className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border transition-colors
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${
                            selected
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-gray-200 text-gray-700 hover:border-red-200 hover:bg-gray-50"
                          }`}
                      >
                        <span className="text-sm font-semibold">{days} days</span>
                        <span className="text-xs text-gray-500">
                          {priceLabel(availability.data.prices, days)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">
                    {selectedStart && endDate ? (
                      <span className="font-medium text-gray-900">
                        {formatRange(selectedStart, endDate)}
                      </span>
                    ) : (
                      <span className="text-gray-500">No dates available for this length</span>
                    )}
                  </span>
                </div>

                {/* min/max come from the renewal payload, not the generic availability:
                    renewals clear a shorter lead time, so the generic min would grey out
                    the very day we just suggested. */}
                <FeatureCalendar
                  bookedDays={bookedDays}
                  durationDays={duration}
                  minDate={parseISODate(data.min_start_date)}
                  maxDate={parseISODate(data.max_start_date)}
                  selectedStart={selectedStart}
                  onSelectStart={(d) => {
                    setSelectedStart(d);
                    setPickedManually(true);
                  }}
                />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={!selectedStart} onClick={handleContinue}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === "announcement" && draft && selectedStart && endDate && (
              <>
                <p className="text-sm text-gray-500">
                  This is the announcement you sent last time. Edit anything you'd like before
                  it goes out to subscribers.
                </p>

                <AnnouncementStep
                  draft={draft}
                  onChange={setDraft}
                  startDate={selectedStart}
                  endDate={endDate}
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("dates")}
                    disabled={checkout.isPending}
                  >
                    Back
                  </Button>
                  <Button size="sm" disabled={!canPay || checkout.isPending} onClick={handlePay}>
                    {checkout.isPending ? (
                      <>
                        <Spinner size={14} />
                        Starting checkout…
                      </>
                    ) : (
                      `Pay ${priceLabel(availability.data.prices, duration)}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
