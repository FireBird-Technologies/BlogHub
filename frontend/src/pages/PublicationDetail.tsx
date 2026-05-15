import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { ArrowLeft, ExternalLink, Tag, ThumbsUp, MessageCircle, Calendar, Video, Trophy, Pencil, Trash2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Spinner from "../components/ui/Spinner";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import CommentsSection from "../components/publication/CommentsSection";
import SidebarPublications from "../components/publication/SidebarPublications";
import EditPublicationFieldModal, { type EditableField } from "../components/publication/EditPublicationFieldModal";
import NotFound from "./NotFound";
import { usePublication, getClientTimezone } from "../hooks/usePublications";
import { useAuth } from "../context/AuthContext";
import { usePublicationUpvote } from "../hooks/usePublicationUpvote";
import { resolveSocialIcon } from "../lib/socialIcons";
import { useLinkEmbeds } from "../hooks/useLinkEmbeds";
import type { PublicationId, PaginatedPublications } from "../types/models";

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
  const { user, openLoginModal } = useAuth();
  const { mutate, isPending } = usePublicationUpvote(publicationId, queryKey);

  const wrapCls = highlight ? "bg-red-50 border-red-100 shadow-sm shadow-red-100/60" : "bg-gray-50 border-gray-200";

  const handleClick = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (isPending) return;
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
                  cursor-pointer`}
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

function CommentScrollStat({
  commentCount,
  onLoggedInCommentClick,
}: {
  commentCount: number;
  onLoggedInCommentClick?: () => void;
}) {
  const { user, openLoginModal } = useAuth();

  const handleClick = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    document.getElementById("publication-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => onLoggedInCommentClick?.(), 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={user ? "View comments" : "Sign in to comment"}
      className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl border bg-gray-50 border-gray-200
                 transition-colors hover:border-red-200 hover:bg-red-50/40 cursor-pointer"
    >
      <MessageCircle size={15} className="text-gray-400" />
      <span className="text-lg font-bold text-gray-900">{commentCount}</span>
      <span className="text-[10px] uppercase tracking-wide text-gray-400">Comments</span>
    </button>
  );
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-gray-200
                 bg-white text-xs font-medium text-gray-500 hover:text-red-600 hover:border-red-200
                 hover:bg-red-50 transition-colors shrink-0"
    >
      Edit <Pencil size={12} />
    </button>
  );
}

function hostnameOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href.replace(/^https?:\/\//i, "").split("/")[0];
  }
}

function LinkEmbedsPanel({
  additionalLinks,
  onEdit,
}: {
  additionalLinks: string[];
  onEdit?: () => void;
}) {
  const embeds = useLinkEmbeds(additionalLinks);
  if (!additionalLinks?.length && !onEdit) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Related links</p>
        {onEdit && <EditButton onClick={onEdit} label="Edit related links" />}
      </div>
      {!additionalLinks?.length && (
        <p className="text-xs text-gray-400 italic">No related links yet.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {embeds.map(({ href, isLoading, data }, i) => {
          const title = data?.title || hostnameOf(href);
          const image = data?.image_url || null;
          return (
            <a
              key={`${href}-${i}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              className="group flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden
                         hover:border-red-200 hover:bg-red-50/30 transition-colors min-w-0"
            >
              <div className="aspect-video w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {isLoading ? (
                  <div className="w-full h-full animate-pulse bg-gray-200" />
                ) : image ? (
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ExternalLink size={20} className="text-gray-300" />
                )}
              </div>
              <div className="p-2 flex flex-col min-w-0">
                {isLoading ? (
                  <>
                    <div className="h-3 w-3/4 rounded bg-gray-200 animate-pulse mb-1" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
                  </>
                ) : (
                  <>
                    <p
                      className="text-xs font-medium text-gray-900 leading-snug overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{hostnameOf(href)}</p>
                  </>
                )}
              </div>
            </a>
          );
        })}
      </div>
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
    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Socials</p>
      <div
        className={`flex flex-wrap lg:grid gap-2 justify-items-center content-start auto-rows-min flex-1 min-h-0 overflow-y-auto ${
          socialLinks.length >= 5 ? "lg:grid-cols-2" : "lg:grid-cols-1"
        }`}
      >
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
  const { user } = useAuth();
  const tzShort = tz || getClientTimezone();
  const [thumbError, setThumbError] = useState(false);
  const [commentFocusSignal, setCommentFocusSignal] = useState(0);
  const [editField, setEditField] = useState<EditableField | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: deletePublication, isPending: isDeleting } = useMutation({
    mutationFn: (publicationId: string) =>
      api.delete(`/api/publications/${publicationId}`).then((r) => r.data),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueriesData<{ pages: PaginatedPublications[]; pageParams: unknown[] }>(
        { queryKey: ["publications"] },
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => {
                  const items = page.items.filter((p) => p.id !== deletedId);
                  const removed = page.items.length - items.length;
                  return { ...page, items, total: Math.max(0, (page.total ?? 0) - removed) };
                }),
              }
            : data
      );
      queryClient.setQueriesData<PaginatedPublications>(
        { queryKey: ["publications-preview"] },
        (data) =>
          data
            ? {
                ...data,
                items: data.items.filter((p) => p.id !== deletedId),
                total: Math.max(0, (data.total ?? 0) - 1),
              }
            : data
      );
      queryClient.setQueriesData<{ pages: PaginatedPublications[]; pageParams: unknown[] }>(
        { queryKey: ["user-publications"] },
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => {
                  const items = page.items.filter((p) => p.id !== deletedId);
                  const removed = page.items.length - items.length;
                  return { ...page, items, total: Math.max(0, (page.total ?? 0) - removed) };
                }),
              }
            : data
      );
      queryClient.setQueriesData<PaginatedPublications>(
        { queryKey: ["sidebar-publications"] },
        (data) =>
          data
            ? {
                ...data,
                items: data.items.filter((p) => p.id !== deletedId),
                total: Math.max(0, (data.total ?? 0) - 1),
              }
            : data
      );
      queryClient.removeQueries({ queryKey: ["publication", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-publications"] });
      navigate("/dashboard");
    },
  });

  useEffect(() => {
    setCommentFocusSignal(0);
  }, [id]);

  useEffect(() => {
    setThumbError(false);
  }, [id, pub?.image_url]);

  useEffect(() => {
    if (isLoading || !pub || window.location.hash !== "#publication-comments") return undefined;
    const t1 = window.setTimeout(() => {
      document.getElementById("publication-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    const t2 = window.setTimeout(() => {
      setCommentFocusSignal((n) => n + 1);
    }, 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
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
      <NotFound
        title="Publication not found"
        message="This publication doesn’t exist or has been removed."
      />
    );
  }

  const extras = (pub.additional_links?.length ?? 0) > 0;
  const socials = (pub.social_links?.length ?? 0) > 0;
  const isOwner = !!user && pub.author?.id === user.id;
  const openEdit = (f: EditableField) => setEditField(f);

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 lg:min-h-0 lg:overflow-hidden flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        <div className="flex-[5] min-w-0 lg:min-h-0 lg:overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6 flex flex-col gap-6">
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

          <div className="flex items-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug flex-1">{pub.title}</h1>
            {isOwner && <EditButton onClick={() => openEdit("basics")} label="Edit title, image, category & tags" />}
          </div>

          <div className={`flex flex-col ${socials ? "lg:flex-row lg:items-stretch" : ""} gap-4 lg:gap-6`}>
            <div
              className={`rounded-xl border border-gray-200 bg-gray-100 shadow-sm overflow-hidden
                         ring-1 ring-black/[0.04] aspect-video flex-shrink-0 ${
                           socials ? "w-full lg:flex-1 lg:max-w-[48rem]" : "w-full max-w-2xl"
                         }`}
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

            {socials && (
              <div
                className={`min-w-0 w-full lg:flex-shrink-0 ${
                  (pub.social_links?.length ?? 0) >= 5 ? "lg:w-44" : "lg:w-24"
                }`}
              >
                <SocialPanel socialLinks={pub.social_links} />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Description</p>
              {isOwner && <EditButton onClick={() => openEdit("description")} label="Edit description" />}
            </div>
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
              <ExternalLink size={14} /> Visit publication
            </a>
            {isOwner && <EditButton onClick={() => openEdit("url")} label="Edit article URL" />}
          </div>

          <div className="flex flex-wrap gap-3 items-stretch">
            <RankStat rank={pub.rank ?? null} timezoneLabel={tzShort} />
            <CommentScrollStat
              commentCount={pub.comment_count ?? 0}
              onLoggedInCommentClick={() => setCommentFocusSignal((n) => n + 1)}
            />
            <LikeInteractiveStat
              publicationId={pub.id}
              value={pub.upvote_count}
              highlight={pub.is_upvoted}
              queryKey={queryKey}
            />
          </div>

          {(extras || isOwner) && (
            <LinkEmbedsPanel
              additionalLinks={pub.additional_links}
              onEdit={isOwner ? () => openEdit("additional_links") : undefined}
            />
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
            <Avatar src={pub.author?.avatar_url} name={pub.author?.name} size={48} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{pub.author?.name}</p>
              {pub.created_at && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Calendar size={11} /> {formatDate(pub.created_at)}
                </p>
              )}
            </div>

            {isOwner && (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:inline">Delete this publication?</span>
                  <button
                    type="button"
                    onClick={() => deletePublication(pub.id)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white
                               hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? <Spinner size={12} /> : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200
                               text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                             border border-gray-200 bg-white text-gray-600 hover:text-red-600
                             hover:border-red-200 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                  Delete publication
                </button>
              )
            )}
          </div>


          <CommentsSection publicationId={pub.id} focusSignal={commentFocusSignal} />

          <div className="h-4 flex-shrink-0" />
        </div>

        <div className="hidden lg:block w-px bg-gray-200 flex-shrink-0" />

        <div className="flex-[2.5] min-w-0 lg:min-h-0 lg:overflow-y-auto custom-scrollbar px-4 sm:px-5 py-6 flex flex-col gap-4">
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-800">Other Publications</h3>
            <p className="text-xs text-gray-400 mt-0.5">Scrolls independently</p>
          </div>
          <SidebarPublications currentId={pub.id} />
        </div>
      </div>

      <EditPublicationFieldModal
        publication={pub}
        field={editField}
        isOpen={editField !== null}
        onClose={() => setEditField(null)}
      />
    </div>
  );
}
