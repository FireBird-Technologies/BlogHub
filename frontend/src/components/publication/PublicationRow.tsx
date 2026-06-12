import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import type { QueryKey } from "@tanstack/react-query";
import VerificationBadge from "../ui/VerificationBadge";
import VerifiedTick from "../ui/VerifiedTick";
import Avatar from "../ui/Avatar";
import UpvoteButton from "./UpvoteButton";
import type { Publication } from "../../types/models";
import { useAuth } from "../../context/AuthContext";
import { publicationPath } from "../../lib/publicationUrl";
import { firstSentence } from "../../lib/text";
import { formatCategoryDisplay } from "../../constants/categories";

interface PublicationRowProps {
  publication: Publication;
  queryKey: QueryKey;
  showTopTodayBadge?: boolean;
  /** Override rank badge (e.g. global position on category ranking page). */
  listRank?: number;
}

export default function PublicationRow({
  publication,
  queryKey,
  showTopTodayBadge,
  listRank,
}: PublicationRowProps) {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();
  const {
    id,
    title,
    description,
    image_url,
    category,
    upvote_count,
    comment_count,
    is_upvoted,
    author,
  } = publication;
  const detailPath = publicationPath(publication);
  const byline = author?.tag ? `@${author.tag}` : author?.name?.split(/\s+/)[0] ?? "Reader";
  const categoryLabel = formatCategoryDisplay(category);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(detailPath)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(detailPath);
        }
      }}
      className="group relative flex gap-3 w-full text-left bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3
                 cursor-pointer transition-all hover:border-red-200 hover:shadow-md hover:shadow-red-500/5"
    >
      {showTopTodayBadge && (
        <span
          className="pointer-events-none absolute top-1 left-1 z-20
                     text-[6px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100
                     border border-amber-200 px-1 py-0.5 rounded-md shadow-md whitespace-nowrap"
        >
          Top today
        </span>
      )}

      {listRank != null && (
        <div
          className="flex-shrink-0 w-8 sm:w-9 flex items-center justify-center self-center
                     text-base sm:text-lg font-bold text-gray-900 tabular-nums select-none"
          aria-hidden
        >
          #{listRank}
        </div>
      )}

      <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
        {image_url ? (
          <img
            src={image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
            <svg className="w-8 h-8 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{categoryLabel}</span>
          <span className="text-gray-300 text-xs" aria-hidden>
            |
          </span>
          <h3 className="text-sm font-bold text-gray-900 leading-snug truncate min-w-0 flex-1">
            {title}
          </h3>
        </div>

        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">
            {firstSentence(description)}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <Avatar src={author?.avatar_url} name={author?.name} size={20} />
          <span className="text-xs font-medium text-gray-600 truncate">{byline}</span>
          {publication.is_verified ? (
            <VerifiedTick verifiedAt={publication.verified_at} size={16} className="flex-shrink-0" />
          ) : (
            <VerificationBadge isVerified={false} verifiedAt={publication.verified_at} />
          )}
        </div>
      </div>

      <div
        className="flex flex-col items-stretch justify-center gap-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500
                     bg-gray-50 border border-gray-200 hover:border-red-200 hover:text-red-600 transition-colors"
          onClick={() => {
            if (!user) {
              openLoginModal();
              return;
            }
            navigate(`${detailPath}#publication-comments`);
          }}
        >
          <MessageCircle size={14} />
          {comment_count ?? 0}
        </button>
        <UpvoteButton
          publicationId={id}
          count={upvote_count}
          isUpvoted={is_upvoted}
          queryKey={queryKey}
        />
      </div>
    </article>
  );
}
