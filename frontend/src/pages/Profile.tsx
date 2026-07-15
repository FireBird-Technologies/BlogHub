import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Edit2, Globe, Star, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import PublicationGrid from "../components/publication/PublicationGrid";
import EditPublicationModal from "../components/publication/EditPublicationModal";
import FeaturePublicationModal from "../components/featured/FeaturePublicationModal";
import MarketingEmailModal from "../components/featured/MarketingEmailModal";
import FeaturedAnalyticsModal from "../components/publication/FeaturedAnalyticsModal";
import {
  useMyBookings,
  useMyFeaturedEmails,
  WEBHOOK_POLL_TIMEOUT_MS,
} from "../hooks/useFeaturedEmail";
import type { FeaturedEmail, MyBooking } from "../types/models";
import { ProfileModal } from "../components/auth/ProfileModal";
import { useAuth } from "../context/AuthContext";
import { useUserPublications } from "../hooks/useUserPublications";
import api from "../lib/api";
import type { Publication } from "../types/models";

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [pubToEdit, setPubToEdit] = useState<Publication | null>(null);
  const [featuring, setFeaturing] = useState(false);
  const [tab, setTab] = useState<"mine" | "featured">("mine");
  const [searchParams, setSearchParams] = useSearchParams();

  const queryKey = ["user-publications", user?.id] as const;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserPublications(user?.id);

  const queryClient = useQueryClient();

  // Stripe sends the buyer back here after checkout. This is display only — the
  // webhook is what actually records the payment.
  const checkoutResult = searchParams.get("featured");
  const dismissCheckoutBanner = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("featured");
        return next;
      },
      { replace: true },
    );
  };

  // Stripe returns the buyer here immediately, but the booking and its announcement
  // draft are written by the *webhook*, which lands a few seconds later. A single
  // fetch on arrival therefore sees nothing and caches an empty result — so poll
  // until the rows appear, then stop.
  const [awaitingWebhook, setAwaitingWebhook] = useState(checkoutResult === "success");

  useEffect(() => {
    if (checkoutResult !== "success") return;
    queryClient.invalidateQueries({ queryKey: ["featured"] });
    setAwaitingWebhook(true);
    // Give up eventually: a webhook that never arrives must not poll forever.
    const stop = setTimeout(() => setAwaitingWebhook(false), WEBHOOK_POLL_TIMEOUT_MS);
    return () => clearTimeout(stop);
  }, [checkoutResult, queryClient]);

  const handleDelete = async (publicationId: string) => {
    await api.delete(`/api/publications/${publicationId}`);
    queryClient.invalidateQueries({ queryKey });
  };

  // Featured status + announcement email, keyed by publication, so each card can
  // show its own pill and email button. Expired runs simply aren't returned by the
  // API, so those cards get no pill at all.
  const { data: bookings } = useMyBookings(true, awaitingWebhook);
  const { data: emails } = useMyFeaturedEmails(true, awaitingWebhook);
  // Track the open email by id, not by value: after finalising, the modal must show
  // the *refetched* row (now locked), not the stale snapshot it was opened with.
  const [openEmailId, setOpenEmailId] = useState<string | null>(null);
  const emailToView: FeaturedEmail | null =
    emails?.find((e) => e.id === openEmailId) ?? null;

  // The publication + specific run the analytics modal is showing. Kept as a pair
  // (not just an id) since the modal still labels the run with the publication title.
  const [analyticsTarget, setAnalyticsTarget] = useState<{
    publication: Publication;
    booking: MyBooking;
  } | null>(null);

  // A publication can hold several runs, each with its own announcement — so collect
  // *all* of them, not just the first. The card turns them into a dropdown.
  const featuredInfo = (p: Publication) => ({
    bookings: (bookings ?? []).filter(
      (b) => b.publication_id === p.id && b.approval_status !== "rejected",
    ),
    emails: (emails ?? []).filter((e) => e.publication_id === p.id),
    onOpenEmail: setOpenEmailId,
    onOpenAnalytics: (booking: MyBooking) => setAnalyticsTarget({ publication: p, booking }),
  });

  // One query returns both real and unlisted (feature-only) publications; split them
  // client-side per tab, preserving the InfiniteData page shape for infinite scroll.
  const minePages = data?.pages.map((p) => ({ ...p, items: p.items.filter((x) => !x.is_unlisted) }));
  const featuredPages = data?.pages.map((p) => ({ ...p, items: p.items.filter((x) => x.is_unlisted) }));

  if (!user) return null;

  const websiteHref = user.website
    ? /^https?:\/\//i.test(user.website)
      ? user.website
      : `https://${user.website}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col xs:flex-row sm:flex-row items-start gap-4 sm:gap-5">
            <Avatar src={user.avatar_url} name={user.name} position={user.avatar_position} scale={user.avatar_scale} size={72} className="rounded-2xl" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1
                             text-xs font-medium text-gray-500 transition-colors
                             hover:border-red-300 hover:bg-red-50/40 hover:text-red-600"
                  title="Edit profile"
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
              {user.website && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 mt-2"
                >
                  <Globe size={14} />
                  {user.website.replace(/^https?:\/\//i, "")}
                </a>
              )}
            </div>
          </div>
        </div>

        {checkoutResult && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-3.5 mb-6 text-sm ${
              checkoutResult === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            <p className="flex-1">
              {checkoutResult === "success" ? (
                awaitingWebhook && !bookings?.length ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size={14} />
                    Payment received — confirming your booking…
                  </span>
                ) : (
                  "Payment received — your dates are booked. Our team will review and approve it, then it goes live on your start date. Your announcement email will be set to scheduled once approved."
                )
              ) : (
                "Checkout cancelled. Your dates were not booked."
              )}
            </p>
            <button
              type="button"
              onClick={dismissCheckoutBanner}
              aria-label="Dismiss"
              className="flex-shrink-0 opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6">
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-xs sm:text-sm font-medium">
              <button
                type="button"
                onClick={() => setTab("mine")}
                className={`rounded-md px-2 py-1 sm:px-3 sm:py-1.5 transition-colors ${
                  tab === "mine" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Publications
              </button>
              <button
                type="button"
                onClick={() => setTab("featured")}
                className={`rounded-md px-2 py-1 sm:px-3 sm:py-1.5 transition-colors ${
                  tab === "featured" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Featured listing
              </button>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFeaturing(true)}
              className="gap-1 px-2 py-1 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              <Star size={12} fill="currentColor" className="sm:w-3.5 sm:h-3.5" />
              <span>Feature your publication</span>
            </Button>
          </div>
          <PublicationGrid
            pages={tab === "mine" ? minePages : featuredPages}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            queryKey={queryKey}
            onDelete={handleDelete}
            onEdit={(p) => setPubToEdit(p)}
            featuredInfo={featuredInfo}
            isLoading={isLoading}
            applyImageCrop={false}
            emptyState={
              tab === "mine"
                ? { title: "No publication created yet", description: "" }
                : { title: "No featured listing created yet", description: "" }
            }
          />
        </div>
      </main>

      <ProfileModal mode="edit" isOpen={editing} onClose={() => setEditing(false)} />
      <EditPublicationModal publication={pubToEdit} isOpen={Boolean(pubToEdit)} onClose={() => setPubToEdit(null)} />
      <FeaturePublicationModal isOpen={featuring} onClose={() => setFeaturing(false)} />
      <MarketingEmailModal
        email={emailToView}
        isOpen={Boolean(emailToView)}
        onClose={() => setOpenEmailId(null)}
      />
      {analyticsTarget && (
        <FeaturedAnalyticsModal
          isOpen={Boolean(analyticsTarget)}
          onClose={() => setAnalyticsTarget(null)}
          publication={analyticsTarget.publication}
          booking={analyticsTarget.booking}
        />
      )}
    </div>
  );
}
