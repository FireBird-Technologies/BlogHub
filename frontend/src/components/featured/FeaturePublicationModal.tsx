import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Link2 } from "lucide-react";
import { isAxiosError } from "axios";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CustomDropdown from "../ui/CustomDropdown";
import ImageUploadButton from "../ui/ImageUploadButton";
import AdjustImageModal, { ImageThumbWithAdjust } from "../ui/AdjustImageModal";
import FeatureCalendar from "./FeatureCalendar";
import FeaturedReach from "./FeaturedReach";
import CropImage from "../ui/CropImage";
import { useScrape } from "../../hooks/useScrape";
import { useAuth } from "../../context/AuthContext";
import { useUserPublications } from "../../hooks/useUserPublications";
import {
  useComposeEmail,
  useCreateFeatureCheckout,
  useCreatePublicationFromLink,
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
import { CATEGORIES, formatCategoryDisplay, normalizeCategoryForStorage } from "../../constants/categories";
import { normalizeLinkUrl } from "../../lib/urlNormalize";
import type { Publication } from "../../types/models";

const DEFAULT_DURATION = 7;

type Step = "dates" | "publication" | "announcement";

/** Everything the "Use a link" sub-flow needs to create the publication on Next —
 *  filled in from the scrape, editable before saving. */
interface LinkFields {
  url: string;
  title: string;
  description: string;
  image_url: string;
  image_position: string | null;
  image_scale: number | null;
  category: string;
  customCategory: string;
  tags: string;
}

const EMPTY_LINK_FIELDS: LinkFields = {
  url: "",
  title: "",
  description: "",
  image_url: "",
  image_position: null,
  image_scale: null,
  category: "",
  customCategory: "",
  tags: "",
};

function formatPrice(cents?: number): string {
  if (cents == null) return "—";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

interface FeaturePublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select a package duration when opened from pricing, etc. */
  initialDurationDays?: number;
}

/** Book the site-wide featured slot: pick free dates, pick one of your publications, pay.
 *
 * Payment is confirmed server-side by the Stripe webhook — landing back on the
 * success URL is not proof of anything.
 */
export default function FeaturePublicationModal({
  isOpen,
  onClose,
  initialDurationDays,
}: FeaturePublicationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("dates");
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [publicationId, setPublicationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnnouncementDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 2 has two ways to pick what's being featured: one of the buyer's own
  // publications, or an arbitrary link that isn't (yet) a publication at all — typed
  // in, fetched, edited inline, and saved the moment "Next" is pressed (no separate
  // confirm step of its own).
  //
  // The link tab is the default: most buyers arrive wanting to promote a site or
  // landing page they haven't added to BlogHub, and someone who does own a listing
  // still has the other tab one click away.
  const [pubSource, setPubSource] = useState<"mine" | "link">("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFields, setLinkFields] = useState<LinkFields>(EMPTY_LINK_FIELDS);
  const [linkFetched, setLinkFetched] = useState(false);
  const [adjustingLinkImage, setAdjustingLinkImage] = useState(false);
  const [linkUrlError, setLinkUrlError] = useState<string | null>(null);

  const availability = useFeatureAvailability(isOpen);
  const userPubs = useUserPublications(isOpen ? user?.id : undefined);
  const compose = useComposeEmail();
  const checkout = useCreateFeatureCheckout();
  const createFromLink = useCreatePublicationFromLink();
  const scrape = useScrape();

  // Reset to a clean slate each time the modal is opened.
  useEffect(() => {
    if (isOpen) {
      setStep("dates");
      setSelectedStart(null);
      setDuration(
        initialDurationDays === 7 || initialDurationDays === 14 || initialDurationDays === 30
          ? initialDurationDays
          : DEFAULT_DURATION,
      );
      setPublicationId(null);
      setDraft(null);
      setError(null);
      setPubSource("link");
      setLinkUrl("");
      setLinkFields(EMPTY_LINK_FIELDS);
      setLinkFetched(false);
      setLinkUrlError(null);
    }
  }, [isOpen, initialDurationDays]);

  const handleFetchLink = () => {
    setLinkUrlError(null);
    const withScheme = linkUrl.includes("://") ? linkUrl : `https://${linkUrl}`;
    const canonicalUrl = normalizeLinkUrl(withScheme);
    if (!canonicalUrl) {
      setLinkUrlError("Please enter a valid URL.");
      return;
    }
    // If this link is already one of the buyer's listings, don't create a duplicate —
    // send them to pick it from the "Your publications" tab instead.
    if (publications.some((p) => p.url === canonicalUrl)) {
      setLinkUrlError('This link is already one of your listings — select it from the "Your publications" tab.');
      return;
    }
    scrape.mutate({ url: withScheme, mode: "link" }, {
      onSuccess: (data) => {
        setLinkFields({
          url: canonicalUrl,
          title: data.title ?? "",
          description: data.description ?? "",
          image_url: data.image_url ?? "",
          image_position: null,
          image_scale: null,
          category: "",
          customCategory: "",
          tags: "",
        });
        setLinkFetched(true);
      },
      onError: () => {
        // Still let them fill the form in by hand even if scraping fails.
        setLinkFields((f) => ({ ...f, url: canonicalUrl }));
        setLinkFetched(true);
      },
    });
  };

  /** Resolved category name, honouring "Other / Custom…". */
  const linkCategory =
    linkFields.category === "__custom__" ? linkFields.customCategory : linkFields.category;
  const linkFormValid = Boolean(linkFields.title.trim() && linkCategory.trim());

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

  // Both real publications and feature-only (unlisted) listings are selectable here,
  // so a past featured link can be reused directly without re-entering its URL. Real
  // publications sort first; the reusable feature-only listings follow.
  const publications: Publication[] = [
    ...(userPubs.data?.pages.flatMap((p) => p.items) ?? []),
  ].sort((a, b) => Number(Boolean(a.is_unlisted)) - Number(Boolean(b.is_unlisted)));
  const endDate = selectedStart ? addDays(selectedStart, duration - 1) : null;

  /** Fetch the drafted announcement for a chosen publication and move to the last step. */
  const runCompose = (pubId: string) => {
    if (!selectedStart) return;
    compose.mutate(
      {
        publication_id: pubId,
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

  /** "Next" from step 2: an existing publication goes straight to compose; a link
   *  is saved to the DB first (creating the unlisted publication behind it), then
   *  compose runs immediately after — one click, no separate confirm step. */
  const handleComposeNext = () => {
    if (!selectedStart) return;
    setError(null);

    if (pubSource === "mine") {
      if (!publicationId) return;
      runCompose(publicationId);
      return;
    }

    if (!linkFormValid) return;
    createFromLink.mutate(
      {
        url: linkFields.url,
        title: linkFields.title.trim(),
        description: linkFields.description.trim() || undefined,
        image_url: linkFields.image_url.trim() || undefined,
        image_position: linkFields.image_url.trim() ? linkFields.image_position : null,
        image_scale: linkFields.image_url.trim() ? linkFields.image_scale : null,
        category: normalizeCategoryForStorage(
          linkFields.category === "__custom__" ? linkFields.customCategory : linkFields.category,
        ),
        tags: linkFields.tags.split(",").map((t) => t.trim()).filter(Boolean),
      },
      {
        onSuccess: (pub) => {
          setPublicationId(pub.id);
          runCompose(pub.id);
        },
        onError: (err) => setError(formatApiErrorDetail(err, "Could not save that link.")),
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
    <Modal isOpen={isOpen} onClose={onClose} title="Feature your publication" maxWidth="max-w-lg">
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
            <FeaturedReach variant="compact" durationDays={duration} />

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
            {/* Link tab first, since it's the default — a selected tab sitting to the
                right of an unselected one reads as though something was clicked. */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setPubSource("link")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
                  pubSource === "link" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                <Link2 size={13} /> Use a website link
              </button>
              <button
                type="button"
                onClick={() => setPubSource("mine")}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  pubSource === "mine" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Your publications
              </button>
            </div>

            <p className="text-xs text-gray-400">
              {pubSource === "mine"
                ? "Pick one of the publications you've already added to BlogHub — or reuse a past feature-only listing."
                : "Feature any web page (a product, article, or landing page) that isn't a BlogHub publication. We'll fetch its details and create a listing just for this feature."}
            </p>

            {pubSource === "mine" ? (
              userPubs.isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size={24} />
                </div>
              ) : publications.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  You have no publications yet — submit one first to feature it, or use the "Use a website link" tab.
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
                              <CropImage
                                src={pub.image_url}
                                position={pub.image_position}
                                scale={pub.image_scale}
                                className="w-full h-full"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{pub.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                              {formatCategoryDisplay(pub.category)}
                              {pub.is_unlisted && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5
                                                 text-[10px] font-medium text-gray-500">
                                  Featured listing
                                </span>
                              )}
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
              )
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      setLinkFetched(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchLink()}
                    placeholder="https://example.com/your-page"
                    className="flex-1 bg-white border border-gray-200 text-gray-800 text-sm rounded-lg
                               px-3 py-2.5 placeholder:text-gray-400 focus:outline-none
                               focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                  />
                  <Button type="button" onClick={handleFetchLink} disabled={!linkUrl || scrape.isPending}>
                    {scrape.isPending ? <Spinner size={16} /> : "Fetch"}
                  </Button>
                </div>
                {linkUrlError && <p className="text-red-600 text-sm">{linkUrlError}</p>}

                {linkFetched && (
                  <div className="flex flex-col gap-3 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      {linkFields.image_url ? (
                        <ImageThumbWithAdjust
                          src={linkFields.image_url}
                          position={linkFields.image_position}
                          scale={linkFields.image_scale}
                          className="w-28 h-28"
                          onClick={() => setAdjustingLinkImage(true)}
                        />
                      ) : (
                        <div className="flex-shrink-0 w-28 h-28 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden" />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-gray-600">Image</span>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={linkFields.image_url}
                              onChange={(e) =>
                                setLinkFields((f) => ({ ...f, image_url: e.target.value, image_position: null, image_scale: null }))
                              }
                              placeholder="Paste an image URL…"
                              className="flex-1 min-w-0 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg
                                         px-3 py-2 placeholder:text-gray-400 focus:outline-none
                                         focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                            />
                            <ImageUploadButton
                              onUpload={(dataUrl) =>
                                setLinkFields((f) => ({ ...f, image_url: dataUrl, image_position: null, image_scale: null }))
                              }
                            />
                          </div>
                          {linkFields.image_url && (
                            <p className="text-[11px] text-gray-400">Click the image to adjust its thumbnail crop.</p>
                          )}
                        </label>
                        {linkFields.image_url && (
                          <AdjustImageModal
                            src={linkFields.image_url}
                            isOpen={adjustingLinkImage}
                            position={linkFields.image_position}
                            scale={linkFields.image_scale}
                            aspect={1}
                            onClose={() => setAdjustingLinkImage(false)}
                            onSave={(pos, sc) =>
                              setLinkFields((f) => ({ ...f, image_position: pos, image_scale: sc }))
                            }
                          />
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-gray-600">Category *</span>
                            <CustomDropdown
                              value={linkFields.category}
                              options={[
                                ...CATEGORIES.map((c) => ({ value: c, label: c })),
                                { value: "__custom__", label: "Other / Custom…" },
                              ]}
                              onChange={(v) => setLinkFields((f) => ({ ...f, category: v }))}
                              placeholder="Select…"
                              buttonClassName="text-gray-900 text-xs py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                            />
                            {linkFields.category === "__custom__" && (
                              <input
                                type="text"
                                value={linkFields.customCategory}
                                onChange={(e) =>
                                  setLinkFields((f) => ({ ...f, customCategory: e.target.value }))
                                }
                                placeholder="e.g. Gaming"
                                maxLength={64}
                                className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-lg
                                           px-3 py-2 mt-1 placeholder:text-gray-400 focus:outline-none
                                           focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                              />
                            )}
                          </label>
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-gray-600">Tags</span>
                            <input
                              type="text"
                              value={linkFields.tags}
                              onChange={(e) => setLinkFields((f) => ({ ...f, tags: e.target.value }))}
                              placeholder="ai, ux"
                              className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-lg
                                         px-3 py-2 placeholder:text-gray-400 focus:outline-none
                                         focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-gray-600">Title *</span>
                      <input
                        type="text"
                        value={linkFields.title}
                        onChange={(e) => setLinkFields((f) => ({ ...f, title: e.target.value }))}
                        maxLength={512}
                        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg
                                   px-3 py-2 placeholder:text-gray-400 focus:outline-none
                                   focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-gray-600">Description</span>
                      <textarea
                        value={linkFields.description}
                        onChange={(e) => setLinkFields((f) => ({ ...f, description: e.target.value }))}
                        rows={5}
                        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg
                                   px-3 py-2 placeholder:text-gray-400 focus:outline-none resize-none
                                   focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                      />
                    </label>
                  </div>
                )}
              </div>
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
                disabled={
                  pubSource === "mine"
                    ? !publicationId || compose.isPending
                    : !linkFormValid || createFromLink.isPending || compose.isPending
                }
                onClick={handleComposeNext}
              >
                {createFromLink.isPending ? (
                  <>
                    <Spinner size={14} /> Processing…
                  </>
                ) : compose.isPending ? (
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
