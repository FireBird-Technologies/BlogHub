import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Tag, ThumbsUp, MessageCircle, Calendar, Video, Trophy } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Spinner from "../components/ui/Spinner";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import CommentsSection from "../components/publication/CommentsSection";
import SidebarPublications from "../components/publication/SidebarPublications";
import { usePublication, getClientTimezone } from "../hooks/usePublications";
import { useAuth } from "../context/AuthContext";
import { usePublicationUpvote } from "../hooks/usePublicationUpvote";
import { resolveSocialIcon } from "../lib/socialIcons";
import type { PublicationId } from "../types/models";

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function rankColor(n: number) {
  if (n === 1) return { wrap: "bg-zinc-800 border-zinc-700", text: "text-white", sub: "text-zinc-300" };
  if (n === 2) return { wrap: "bg-slate-500 border-slate-400", text: "text-white", sub: "text-slate-200" };
  if (n === 3) return { wrap: "bg-amber-600 border-amber-500", text: "text-white", sub: "text-amber-100" };
  return { wrap: "bg-gray-100 border-gray-200", text: "text-gray-900", sub: "text-gray-400" };
}

function RankStat({ rank, timezoneLabel }: { rank: number | null | undefined; timezoneLabel: string }) {
  const hasRank = typeof rank === "number" && Number.isFinite(rank);
  const styles = hasRank
    ? rankColor(rank)
    : { wrap: "bg-gray-50 border-gray-200", text: "text-gray-400", sub: "text-gray-400" };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 px-5 py-3 rounded-xl border min-w-[5.75rem] ${styles.wrap}`}
      title={
        hasRank
          ? `That day’s rank #${rank} among posts with the same calendar date as this one (${timezoneLabel}). Score = upvotes + comments.`
          : "Rank unavailable"
      }
    >
      <Trophy size={15} className={styles.sub} />
      <span className={`text-lg font-bold tabular-nums ${styles.text}`}>{hasRank ? `#${rank}` : "—"}</span>
      <span className={`text-[10px] uppercase tracking-wide text-center leading-tight ${styles.sub}`}>
        Day rank
      </span>
    </div>
  );
}

function LikeInteractiveStat({
  publicationId,
  value,
  highlight,
  queryKey,
}: {
  publicationId: PublicationId;
  value: number;
  highlight: boolean;
  queryKey: readonly unknown[];
}) {
  const { user } = useAuth();
  const { mutate, isPending } = usePublicationUpvote(publicationId, queryKey);

  const wrapCls = highlight ? "bg-red-50 border-red-100 shadow-sm shadow-red-100/60" : "bg-gray-50 border-gray-200";

  const handleClick = () => {
    if (!user || isPending) return;
    mutate();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={user ? "Tap to like or unlike" : "Sign in to like"}
      className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl border transition-colors disabled:opacity-60
                  ${highlight ? wrapCls : `${wrapCls} hover:border-red-200 hover:bg-red-50/40`}
                  ${!user ? "cursor-default" : "cursor-pointer"}`}
    >
      {isPending ? (
        <Spinner size={15} />
      ) : (
        <ThumbsUp size={15} className={highlight ? "text-red-400" : "text-gray-400"} />
      )}
      <span className={`text-lg font-bold ${highlight ? "text-red-600" : "text-gray-900"}`}>{value}</span>
      <span className={`text-[10px] uppercase tracking-wide ${highlight ? "text-red-400" : "text-gray-400"}`}>
        Upvotes
      </span>
    </button>
  );
}

function CommentScrollStat({ commentCount }: { commentCount: number }) {
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById("publication-comments")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl border bg-gray-50 border-gray-200
                 transition-colors hover:border-red-200 hover:bg-red-50/40 cursor-pointer"
    >
      <MessageCircle size={15} className="text-gray-400" />
      <span className="text-lg font-bold text-gray-900">{commentCount}</span>
      <span className="text-[10px] uppercase tracking-wide text-gray-400">Comments</span>
    </button>
  );
}

function shortenUrlLine(href: string, maxLen = 54): string {
  try {
    const u = new URL(href);
    const path = `${u.pathname}${u.search}${u.hash}`;
    let s = `${u.hostname.replace(/^www\./, "")}${path === "/" ? "" : path}`;
    if (s.length > maxLen) s = `${s.slice(0, maxLen - 1)}…`;
    return s;
  } catch {
    const s0 = href.replace(/^https?:\/\//i, "");
    if (s0.length <= maxLen) return s0;
    return `${s0.slice(0, maxLen - 1)}…`;
  }
}

function LinksPanel({ additionalLinks }: { additionalLinks: string[] }) {
  if (!additionalLinks?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Related links</p>
      <ul className="flex flex-col gap-1.5 min-w-0">
        {additionalLinks.map((href, i) => (
          <li key={`${href}-${i}`} className="min-w-0">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={href}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-2 min-w-0 max-w-full"
            >
              <ExternalLink size={14} className="flex-shrink-0 opacity-70" />
              <span className="truncate">{shortenUrlLine(href)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialPanel({
  socialLinks,
}: {
  socialLinks: Array<{ label: string; url: string }>;
}) {
  if (!socialLinks?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Social</p>
      <div className="flex flex-wrap gap-2">
        {socialLinks.map((entry, i) => {
          const { Icon, label } = resolveSocialIcon(entry.url, entry.label);
          const isMail = entry.url.startsWith("mailto:");
          return (
            <a
              key={`${entry.url}-${i}`}
              href={entry.url}
              {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              title={`${entry.label} — ${entry.url}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200
                         bg-gray-50 text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50
                         hover:text-red-600"
              aria-label={label}
            >
              <Icon size={20} className="text-gray-700" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function PublicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pub, isLoading, isError, queryKey, tz } = usePublication(id);
  const tzShort = tz || getClientTimezone();
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    setThumbError(false);
  }, [id, pub?.image_url]);

  useEffect(() => {
    if (isLoading || !pub || window.location.hash !== "#publication-comments") return undefined;
    const t = window.setTimeout(() => {
      document.getElementById("publication-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [isLoading, pub?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-32">
          <Spinner size={36} />
        </div>
      </div>
    );
  }

  if (isError || !pub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center py-32 gap-3">
          <p className="text-gray-500">Publication not found.</p>
          <button type="button" onClick={() => navigate(-1)} className="text-sm text-red-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const extras = (pub.additional_links?.length ?? 0) > 0;
  const socials = (pub.social_links?.length ?? 0) > 0;

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 lg:min-h-0 lg:overflow-hidden flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        <div className="flex-[3] min-w-0 lg:min-h-0 lg:overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6 flex flex-col gap-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-shrink-0 self-start flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <Badge category={pub.category} />
            {pub.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                           bg-gray-100 text-gray-600 border border-gray-200"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
            <a
              href="https://blog2video.app"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium
                         text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm flex-shrink-0"
            >
              <Video size={12} className="text-red-500" />
              Convert to video
              <ExternalLink size={10} className="text-gray-400" />
            </a>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{pub.title}</h1>

          <div
            className={`flex flex-col ${extras || socials ? "lg:flex-row lg:items-start" : ""} gap-4 lg:gap-6`}
          >
            <div
              className={`rounded-xl border border-gray-200 bg-gray-100 shadow-sm overflow-hidden
                         ring-1 ring-black/[0.04] aspect-video flex-shrink-0
                         ${extras || socials ? "w-full lg:w-[min(50%,28rem)]" : "w-full max-w-xl"}`}
            >
              {pub.image_url && !thumbError ? (
                <img
                  src={pub.image_url}
                  alt={pub.title}
                  className="w-full h-full object-cover"
                  onError={() => setThumbError(true)}
                />
              ) : (
                <div
                  className="w-full h-full min-h-[7.5rem] flex flex-col items-center justify-center gap-2
                             bg-gradient-to-br from-gray-100 to-gray-200/90 text-gray-400"
                  aria-hidden
                >
                  <svg className="w-14 h-14 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.25}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-gray-500">No thumbnail</span>
                </div>
              )}
            </div>

            {(extras || socials) && (
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <LinksPanel additionalLinks={pub.additional_links} />
                <SocialPanel socialLinks={pub.social_links} />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</p>
            {pub.description ? (
              <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">{pub.description}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">No description provided.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700
                         text-white text-sm font-medium transition-colors shadow-sm shadow-red-600/20 cursor-pointer"
            >
              <ExternalLink size={14} /> Read Article
            </a>
          </div>

          <div className="flex flex-wrap gap-3 items-stretch">
            <RankStat rank={pub.rank ?? null} timezoneLabel={tzShort} />
            <CommentScrollStat commentCount={pub.comment_count ?? 0} />
            <LikeInteractiveStat
              publicationId={pub.id}
              value={pub.upvote_count}
              highlight={pub.is_upvoted}
              queryKey={queryKey}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
            <Avatar src={pub.author?.avatar_url} name={pub.author?.name} size={48} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{pub.author?.name}</p>
              <p className="text-xs text-gray-400">{pub.author?.email}</p>
              {pub.created_at && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Calendar size={11} /> {formatDate(pub.created_at)}
                </p>
              )}
            </div>
          </div>


          <CommentsSection publicationId={pub.id} />

          <div className="h-4 flex-shrink-0" />
        </div>

        <div className="hidden lg:block w-px bg-gray-200 flex-shrink-0" />

        <div className="flex-[1] min-w-0 lg:min-h-0 lg:overflow-y-auto custom-scrollbar px-4 sm:px-5 py-6 flex flex-col gap-4">
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-800">Other Publications</h3>
            <p className="text-xs text-gray-400 mt-0.5">Scrolls independently</p>
          </div>
          <SidebarPublications currentId={pub.id} />
        </div>
      </div>
    </div>
  );
}
