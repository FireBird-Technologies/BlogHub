import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { isAxiosError } from "axios";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CustomDropdown from "../ui/CustomDropdown";
import FeatureCalendar from "./FeatureCalendar";
import { useAuth } from "../../context/AuthContext";
import { useUserPublications } from "../../hooks/useUserPublications";
import {
  useComposeEmail,
  useCreateFeatureCheckout,
  useFeatureAvailability,
} from "../../hooks/useFeatured";
import AnnouncementStep, {
  draftFromSuggestion,
  draftSendAtUtc,
  type AnnouncementDraft,
} from "./AnnouncementStep";
import { formatApiErrorDetail } from "../../lib/api";
import {
  addDays,
  buildBookedSet,
  formatRange,
  localZone,
  parseISODate,
  toISODate,
} from "../../lib/dates";
import { formatCategoryDisplay } from "../../constants/categories";
import type { Publication } from "../../types/models";

const DEFAULT_DURATION = 7;

type Step = "dates" | "publication" | "announcement";

function formatPrice(cents?: number): string {
  if (cents == null) return "—";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

interface FeaturePublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Book the site-wide featured slot: pick free dates, pick one of your publications, pay.
 *
 * Payment is confirmed server-side by the Stripe webhook — landing back on the
 * success URL is not proof of anything.
 */
export default function FeaturePublicationModal({ isOpen, onClose }: FeaturePublicationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("dates");
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [publicationId, setPublicationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnnouncementDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availability = useFeatureAvailability(isOpen);
  const userPubs = useUserPublications(isOpen ? user?.id : undefined);
  const compose = useComposeEmail();
  const checkout = useCreateFeatureCheckout();

  // Reset to a clean slate each time the modal is opened.
  useEffect(() => {
    if (isOpen) {
      setStep("dates");
      setSelectedStart(null);
      setDuration(DEFAULT_DURATION);
      setPublicationId(null);
      setDraft(null);
      setError(null);
    }
  }, [isOpen]);

  const bookedDays = useMemo(
    () => buildBookedSet(availability.data?.booked ?? []),
    [availability.data],
  );

  const durations = useMemo(
    () => Object.keys(availability.data?.prices ?? {}).map(Number).sort((a, b) => a - b),
    [availability.data],
  );
  const durationOptions = useMemo(
    () =>
      durations.map((d) => ({
        value: String(d),
        label: `${d} days - ${formatPrice(availability.data?.prices[String(d)])}`,
      })),
    [availability.data?.prices, durations],
  );
  const priceLabel = formatPrice(availability.data?.prices[String(duration)]);

  const publications: Publication[] = userPubs.data?.pages.flatMap((p) => p.items) ?? [];
  const endDate = selectedStart ? addDays(selectedStart, duration - 1) : null;

  /** Publication chosen — fetch the drafted announcement and move to the last step. */
  const handleComposeNext = () => {
    if (!selectedStart || !publicationId) return;
    setError(null);
    compose.mutate(
      {
        publication_id: publicationId,
        start_date: toISODate(selectedStart),
        duration_days: duration,
      },
      {
        onSuccess: (data) => {
          setDraft(
            draftFromSuggestion(data.subject, data.body, data.button_text, data.suggested_send_at),
          );
          setStep("announcement");
        },
        onError: (err) =>
          setError(formatApiErrorDetail(err, "Could not draft your announcement.")),
      },
    );
  };

  const handlePay = () => {
    if (!selectedStart || !publicationId || !draft) return;
    setError(null);
    checkout.mutate(
      {
        publication_id: publicationId,
        start_date: toISODate(selectedStart),
        duration_days: duration,
        email_subject: draft.subject.trim(),
        email_body: draft.body.trim(),
        email_button_text: draft.buttonText.trim(),
        // The author's local day + hour, as the UTC instant it actually refers to.
        email_scheduled_at: draftSendAtUtc(draft),
        email_timezone: localZone(),
      },
      {
        onError: (err) => {
          setError(formatApiErrorDetail(err, "Could not start checkout. Please try again."));
          // Someone booked these dates while the modal was open — repaint the
          // calendar and send the user back to pick again.
          if (isAxiosError(err) && err.response?.status === 409) {
            setSelectedStart(null);
            setStep("dates");
            availability.refetch();
          }
        },
      },
    );
  };

  const sendTimeValid = draft ? new Date(draftSendAtUtc(draft)).getTime() > Date.now() : false;
  const canPay = Boolean(
    draft?.subject.trim() && draft?.body.trim() && draft?.buttonText.trim() && sendTimeValid,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feature a publication" maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className={step === "dates" ? "text-red-600" : "text-gray-400"}>1. Dates</span>
          <span className="text-gray-300">→</span>
          <span className={step === "publication" ? "text-red-600" : "text-gray-400"}>
            2. Publication
          </span>
          <span className="text-gray-300">→</span>
          <span className={step === "announcement" ? "text-red-600" : "text-gray-400"}>
            3. Announcement
          </span>
        </div>

        {availability.isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        )}

        {availability.isError && (
          <p className="text-sm text-gray-500 py-8 text-center">
            Could not load availability. Please close and try again.
          </p>
        )}

        {availability.data && step === "dates" && (
          <>
            <p className="text-sm text-gray-500">
              Pick a duration and start date. Your publication will be the only featured post on
              BlogHub during that run. Greyed-out days are already booked.
            </p>

            {durations.length > 1 && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Duration</span>
                <CustomDropdown
                  value={String(duration)}
                  options={durationOptions}
                  onChange={(value) => {
                    setDuration(Number(value));
                    setSelectedStart(null);
                  }}
                  buttonClassName="text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>
            )}

            <FeatureCalendar
              bookedDays={bookedDays}
              durationDays={duration}
              minDate={parseISODate(availability.data.min_start_date)}
              maxDate={parseISODate(availability.data.max_start_date)}
              selectedStart={selectedStart}
              onSelectStart={setSelectedStart}
            />

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {selectedStart && endDate ? (
                  <span className="font-medium text-gray-900">
                    {formatRange(selectedStart, endDate)}
                  </span>
                ) : (
                  "No dates selected"
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedStart}
                  onClick={() => setStep("publication")}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {availability.data && step === "publication" && selectedStart && endDate && (
          <>
            <p className="text-sm text-gray-500">
              Which publication should run in the featured slot?
            </p>

            {userPubs.isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size={24} />
              </div>
            ) : publications.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                You have no publications yet — submit one first.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto thin-scrollbar list-none p-0 m-0">
                {publications.map((pub) => {
                  const selected = pub.id === publicationId;
                  return (
                    <li key={pub.id}>
                      <button
                        type="button"
                        onClick={() => setPublicationId(pub.id)}
                        className={`w-full flex items-center gap-3 text-left rounded-xl border p-2.5 transition-colors ${
                          selected
                            ? "border-red-300 bg-red-50/50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 overflow-hidden">
                          {pub.image_url && (
                            <img
                              src={pub.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{pub.title}</p>
                          <p className="text-xs text-gray-400">
                            {formatCategoryDisplay(pub.category)}
                          </p>
                        </div>
                        {selected && (
                          <Check size={16} className="text-red-600 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Dates</span>
                <span className="font-medium text-gray-900">
                  {formatRange(selectedStart, endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">{duration} days</span>
              </div>
            </div>

            {error && (
              <p className="flex items-start gap-1.5 text-sm text-red-600">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={() => setStep("dates")} disabled={compose.isPending}>
                <ArrowLeft size={14} /> Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!publicationId || compose.isPending}
                onClick={handleComposeNext}
              >
                {compose.isPending ? (
                  <>
                    <Spinner size={14} /> Drafting…
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </>
        )}

        {step === "announcement" && draft && selectedStart && endDate && (
          <>
            <AnnouncementStep
              draft={draft}
              onChange={setDraft}
              startDate={selectedStart}
              endDate={endDate}
            />

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Featured</span>
                <span className="font-medium text-gray-900">
                  {formatRange(selectedStart, endDate)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-900">{priceLabel}</span>
              </div>
            </div>

            {error && (
              <p className="flex items-start gap-1.5 text-sm text-red-600">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("publication")}
                disabled={checkout.isPending}
              >
                <ArrowLeft size={14} /> Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!canPay || checkout.isPending}
                onClick={handlePay}
              >
                {checkout.isPending ? (
                  <>
                    <Spinner size={14} /> Redirecting…
                  </>
                ) : (
                  "Get Featured"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
