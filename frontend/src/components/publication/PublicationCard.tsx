import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import FeaturedSlotsMenu from "./FeaturedSlotsMenu";
import type { QueryKey } from "@tanstack/react-query";
import Badge from "../ui/Badge";
import VerifiedTick from "../ui/VerifiedTick";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import UpvoteButton from "./UpvoteButton";
import CommentsModal from "./CommentsModal";
import type { FeaturedEmail, MyBooking, Publication } from "../../types/models";
import { useAuth } from "../../context/AuthContext";
import { publicationPath } from "../../lib/publicationUrl";

function RankBadge({ rank }: { rank: number }) {
  const base =
    "absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow";
  if (rank === 1) return <div className={`${base} bg-yellow-400`}>#1</div>;
  if (rank === 2) return <div className={`${base} bg-gray-400`}>#2</div>;
  if (rank === 3) return <div className={`${base} bg-amber-600`}>#3</div>;
  if (rank <= 10) return <div className={`${base} bg-gray-500`}>#{rank}</div>;
  return null;
}

interface PublicationCardProps {
  publication: Publication;
  queryKey: QueryKey;
  onDelete?: (id: string) => void | Promise<void>;
  onEdit?: (p: Publication) => void;
  rank?: number;
  /** This publication's featured runs. A publication may hold several, so with more
   *  than one the pill becomes a dropdown. Empty/undefined renders nothing. */
  featuredBookings?: MyBooking[];
  /** The announcements for those runs, paired by `slot_id`. */
  featuredEmails?: FeaturedEmail[];
  /** Opens one announcement by id. */
  onOpenEmail?: (emailId: string) => void;
  /** Opens the analytics modal for a given featured run. */
  onOpenAnalytics?: (booking: MyBooking) => void;
}

export default function PublicationCard({
  publication,
  queryKey,
  onDelete,
  onEdit,
  rank,
  featuredBookings,
  featuredEmails,
  onOpenEmail,
  onOpenAnalytics,
}: PublicationCardProps) {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();
  const { id, title, description, image_url, category, upvote_count, comment_count, is_upvoted, author } =
    publication;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleDelete = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  // Created from an arbitrary link for a featured slot — it has no reachable public
  // detail page, so the card should go straight to the external URL instead.
  const handleCardClick = () => {
    if (publication.is_unlisted) {
      window.open(publication.url, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(publicationPath(publication));
  };

  return (
    <article
      role="presentation"
      onClick={handleCardClick}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer
                 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                 hover:shadow-lg hover:shadow-black/5 flex flex-col"
    >
      <div className="relative aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
        {rank != null && rank > 0 && <RankBadge rank={rank} />}
        {featuredBookings && featuredBookings.length > 0 && onOpenEmail && onOpenAnalytics && (
          <div className="absolute top-2 right-2 z-10">
            <FeaturedSlotsMenu
              bookings={featuredBookings}
              emails={featuredEmails ?? []}
              onOpenEmail={onOpenEmail}
              onOpenAnalytics={onOpenAnalytics}
            />
          </div>
        )}
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML =
                  '<div class="w-full h-full flex items-center justify-center"><div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center"><svg class="text-red-300 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="text-red-300 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <Badge category={category} />
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {title}
          {publication.is_verified && (
            <VerifiedTick verifiedAt={publication.verified_at} size={14} className="ml-1 -mt-0.5" />
          )}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{description}</p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          {confirming ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Delete this publication?</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white
                             hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? <Spinner size={12} /> : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirming(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200
                             text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar src={author?.avatar_url} name={author?.name} size={24} />
                <span className="text-xs text-gray-400 truncate">{author?.name?.split(/\s+/)[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(publication);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                               bg-gray-50 text-gray-500 border border-gray-200
                               hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
                    aria-label="Edit publication"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                               bg-gray-50 text-gray-400 border border-gray-200
                               hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) {
                      openLoginModal();
                      return;
                    }
                    setCommentsOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                             bg-gray-50 text-gray-500 border border-gray-200
                             hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <span className="inline-flex w-7 items-center justify-center">
                    <MessageCircle size={13} />
                  </span>
                  <span>{comment_count ?? 0}</span>
                </button>
                <UpvoteButton
                  publicationId={id}
                  count={upvote_count}
                  isUpvoted={is_upvoted}
                  queryKey={queryKey}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <CommentsModal
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        publication={publication}
      />
    </article>
  );
}
