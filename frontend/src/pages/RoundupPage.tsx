import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calendar, TrendingUp, Award, MessageCircle } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/landing/Footer";
import NotFound from "./NotFound";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import VerifiedTick from "../components/ui/VerifiedTick";
import SubmitModal from "../components/submit/SubmitModal";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { useRoundup } from "../hooks/useRoundups";
import { useAuth } from "../context/AuthContext";
import { siteName, defaultOgImage } from "../content/siteContent";
import { publicationPath } from "../lib/publicationUrl";
import { CATEGORY_DESCRIPTIONS } from "../constants/categories";
import type { Publication, RoundupDetail } from "../types/models";

function formatMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function roundupSchema(roundup: RoundupDetail, variant: "top" | "underrated" = "top") {
  const items = variant === "underrated" ? roundup.underrated ?? [] : roundup.publications;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      variant === "underrated"
        ? `Underrated ${roundup.category} Blogs — ${formatMonth(roundup.week_start)}`
        : roundup.title,
    itemListElement: items.map((pub, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${window.location.origin}${publicationPath(pub)}`,
      name: pub.title,
    })),
  };
}

function RoundupItem({ pub, position }: { pub: Publication; position: number }) {
  const byline = pub.author?.tag ? `@${pub.author.tag}` : pub.author?.name ?? "Reader";

  return (
    <li>
      <Link
        to={publicationPath(pub)}
        className="group flex gap-4 w-full bg-white border border-gray-200 rounded-xl p-3 sm:p-4
                   transition-all hover:border-red-200 hover:shadow-md hover:shadow-red-500/5"
      >
        {/* Rank */}
        <div
          className="flex-shrink-0 w-9 flex items-center justify-center self-center
                     text-lg font-bold text-gray-900 tabular-nums select-none"
          aria-hidden
        >
          {position}
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
          {pub.image_url ? (
            <img
              src={pub.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
              <svg className="w-8 h-8 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <Badge category={pub.category} />
            {pub.is_verified && (
              <VerifiedTick verifiedAt={pub.verified_at} size={14} className="flex-shrink-0" />
            )}
            {pub.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-gray-400 hidden sm:inline">#{tag}</span>
            ))}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug truncate group-hover:text-red-600 transition-colors">
            {pub.title}
          </h3>

          {pub.description && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 hidden sm:block">{pub.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto">
            <div className="flex items-center gap-1.5">
              <Avatar src={pub.author?.avatar_url} name={pub.author?.name} size={20} />
              <span className="text-xs font-medium text-gray-600 truncate">{byline}</span>
            </div>
            <span className="text-gray-300 text-xs hidden sm:inline" aria-hidden>|</span>
            <span className="text-xs text-gray-400 hidden sm:inline">{formatFullDate(pub.created_at)}</span>
            {pub.social_links && pub.social_links.length > 0 && (
              <>
                <span className="text-gray-300 text-xs hidden md:inline" aria-hidden>|</span>
                <div className="hidden md:flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                  {pub.social_links.slice(0, 3).map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-gray-400 hover:text-red-600 transition-colors
                                 px-1.5 py-0.5 rounded border border-gray-200 hover:border-red-200"
                    >
                      {link.label}
                    </a>
                  ))}
                  {pub.social_links.length > 3 && (
                    <span className="text-[11px] text-gray-400">+{pub.social_links.length - 3}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats (right side) */}
        <div
          className="flex flex-col items-end justify-center gap-2 flex-shrink-0 pl-2"
          onClick={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <TrendingUp size={14} className="text-red-500" />
            <span>{pub.upvote_count}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <MessageCircle size={14} />
            <span>{pub.comment_count}</span>
          </div>
          <a
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Visit <ArrowUpRight size={12} />
          </a>
        </div>
      </Link>
    </li>
  );
}

export default function RoundupPage({
  slug,
  variant = "top",
}: {
  slug: string | undefined;
  variant?: "top" | "underrated";
}) {
  const { user, openLoginModal } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);
  const { data: roundup, isLoading, isError } = useRoundup(slug);
  const isUnderrated = variant === "underrated";

  useDocumentMeta({
    title: roundup
      ? isUnderrated
        ? `Underrated ${roundup.category} Blogs — ${formatMonth(roundup.week_start)} — ${siteName}`
        : `${roundup.title} — ${siteName}`
      : undefined,
    description: roundup
      ? isUnderrated
        ? `Underrated ${roundup.category} blogs on ${siteName} for ${formatMonth(roundup.week_start)} — great reads that haven't found their audience yet.`
        : `The top ${roundup.category} blogs on ${siteName} for ${formatMonth(roundup.week_start)}, ranked by reader upvotes and discussion.`
      : undefined,
    canonicalUrl: roundup
      ? `${window.location.origin}/blogs/${roundup.slug}${isUnderrated ? "/underrated" : ""}`
      : undefined,
    image: defaultOgImage,
    type: "article",
  });
  useJsonLd(roundup ? roundupSchema(roundup, variant) : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded w-2/3" />
            <div className="h-5 bg-gray-200 rounded w-full max-w-xl" />
            <div className="h-5 bg-gray-200 rounded w-3/4 max-w-lg" />
            <div className="space-y-5 mt-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-52 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !roundup) {
    return <NotFound title="Roundup not found" message="This roundup doesn't exist or has been removed." />;
  }

  const underrated = roundup.underrated ?? [];

  // The underrated page is a 404 when the roundup has no underrated entries.
  if (isUnderrated && underrated.length === 0) {
    return <NotFound title="Roundup not found" message="This roundup doesn't exist or has been removed." />;
  }

  const categoryDesc = isUnderrated
    ? `Underrated ${roundup.category.toLowerCase()} blogs — quietly excellent reads that haven't found their audience yet.`
    : CATEGORY_DESCRIPTIONS[roundup.category] ??
      `The best ${roundup.category.toLowerCase()} blogs, chosen by the community.`;
  const pubs = isUnderrated ? underrated : roundup.publications;
  const totalCount = pubs.length;
  const totalUpvotes = pubs.reduce((sum, p) => sum + p.upvote_count, 0);
  const totalComments = pubs.reduce((sum, p) => sum + p.comment_count, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-14">
        {/* Breadcrumb */}
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
        >
          All roundups
        </Link>

        {/* Header */}
        <header className="mt-8 pb-10 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
            <Badge category={roundup.category} />
            <span className="text-red-600 font-semibold uppercase tracking-wide">
              {isUnderrated ? "Underrated picks" : "Monthly roundup"}
            </span>
            <span aria-hidden className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} />
              {formatMonth(roundup.week_start)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mt-4">
            {isUnderrated
              ? `Underrated ${roundup.category} Blogs — ${formatMonth(roundup.week_start)}`
              : roundup.title}
          </h1>

          <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-3xl leading-relaxed">
            {categoryDesc}
          </p>

          <p className="text-sm text-gray-400 mt-4 max-w-3xl leading-relaxed">
            {isUnderrated ? (
              <>
                These are the lowest-scored {roundup.category.toLowerCase()} blogs on {siteName}{" "}
                in {formatMonth(roundup.week_start)} — hidden gems that deserve more eyes.
              </>
            ) : (
              <>
                These are the {roundup.category.toLowerCase()} blogs {siteName} readers rated highest
                in {formatMonth(roundup.week_start)} — ranked by a combination of upvotes and discussion activity.
                Each publication earned its spot through genuine community engagement.
              </>
            )}
          </p>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8">
            <div className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-xl">
              <Award size={22} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-xs text-gray-400">Publications</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-xl">
              <TrendingUp size={22} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-900">{totalUpvotes}</p>
                <p className="text-xs text-gray-400">Total upvotes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-xl">
              <svg className="text-blue-500 w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalComments}</p>
                <p className="text-xs text-gray-400">Total comments</p>
              </div>
            </div>
          </div>
        </header>

        {/* Publication list (single column — top picks or underrated gems per variant) */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {isUnderrated ? "Underrated Blogs" : "Rankings"}
            </h2>
            {/* Cross-link to the other variant when it has entries. */}
            {isUnderrated ? (
              <Link
                to={`/blogs/${roundup.slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                See the top picks <ArrowRight size={14} />
              </Link>
            ) : (
              underrated.length > 0 && (
                <Link
                  to={`/blogs/${roundup.slug}/underrated`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  See underrated gems <ArrowRight size={14} />
                </Link>
              )
            )}
          </div>
          <ol className="space-y-6">
            {pubs.map((pub, i) => (
              <RoundupItem key={pub.id} pub={pub} position={i + 1} />
            ))}
          </ol>
        </section>

        {/* How we rank */}
        <section className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 lg:p-10">
          <h2 className="text-base font-bold text-gray-900">How we rank</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-2xl">
            {isUnderrated ? (
              <>
                These are the <strong>lowest-scored</strong> {roundup.category} blogs that month —
                the combined score of reader upvotes and comment activity during{" "}
                {formatMonth(roundup.week_start)}, ranked from the bottom up. They don&rsquo;t overlap
                with the top picks.
              </>
            ) : (
              <>
                Rankings are based on the combined score of reader upvotes and comment activity during{" "}
                {formatMonth(roundup.week_start)}. Only publications submitted and categorized
                under <strong>{roundup.category}</strong> are eligible.
              </>
            )}
          </p>
        </section>

        {/* CTA */}
        <section className="mt-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-bold text-white">Want your blog featured in our next issue?</h2>
          <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto leading-relaxed">
            Add your own publication to {siteName} and let the community decide.
            The highest-rated blogs in every category are featured in our monthly roundups.
          </p>
          <button
            type="button"
            onClick={() => (user ? setSubmitOpen(true) : openLoginModal())}
            className="inline-flex items-center gap-1.5 mt-6 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700
                       text-sm font-semibold text-white transition-colors shadow-sm shadow-red-600/20"
          >
            Add your publication <ArrowRight size={15} />
          </button>
        </section>
      </main>

      <SubmitModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />
      <Footer />
    </div>
  );
}
