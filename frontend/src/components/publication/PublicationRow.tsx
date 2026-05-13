import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import type { QueryKey } from "@tanstack/react-query";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import UpvoteButton from "./UpvoteButton";
import type { Publication } from "../../types/models";

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PublicationRowProps {
  publication: Publication;
  queryKey: QueryKey;
  showTopTodayBadge?: boolean;
}

export default function PublicationRow({ publication, queryKey, showTopTodayBadge }: PublicationRowProps) {
  const navigate = useNavigate();
  const {
    id,
    title,
    description,
    image_url,
    category,
    tags,
    upvote_count,
    comment_count,
    is_upvoted,
    author,
    created_at,
  } = publication;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/publications/${id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/publications/${id}`);
        }
      }}
      className="group relative flex gap-3 sm:gap-4 w-full text-left bg-white border border-gray-200 rounded-xl p-3 sm:p-4
                 cursor-pointer transition-all hover:border-gray-300 hover:shadow-md hover:shadow-black/[0.04]"
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

      <div className="flex-shrink-0 w-24 h-16 sm:w-32 sm:h-[4.5rem] rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
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

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge category={category} />
          {tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"
            >
              {tag}
            </span>
          ))}
          {(tags?.length ?? 0) > 4 && (
            <span className="text-[10px] text-gray-400">+{(tags?.length ?? 0) - 4}</span>
          )}
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 hidden sm:block">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Avatar src={author?.avatar_url} name={author?.name} size={22} />
          <span className="text-xs text-gray-500 truncate">{author?.name}</span>
          {created_at && (
            <span className="text-[10px] text-gray-400 ml-1">{formatShortDate(created_at)}</span>
          )}
        </div>
      </div>

      <div
        className="flex flex-col items-end justify-center gap-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500
                     bg-gray-50 border border-gray-200 hover:border-red-200 hover:text-red-600 transition-colors"
          onClick={() => navigate(`/publications/${id}#publication-comments`)}
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
