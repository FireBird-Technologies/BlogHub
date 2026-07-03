import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/landing/Footer";
import Pagination from "../components/ui/Pagination";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { useRoundups } from "../hooks/useRoundups";
import { siteName } from "../content/siteContent";
import { blogIndexSchema } from "../seo/schema";
import type { RoundupSummary } from "../types/models";

/** Max roundup cards shown per section page (desktop and mobile). */
const ROUNDUPS_PER_PAGE = 6;

function formatMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function blurb(roundup: RoundupSummary): string {
  return `The top ${roundup.category.toLowerCase()} blogs on ${siteName} this month, ranked by reader upvotes and discussion.`;
}

function underratedBlurb(roundup: RoundupSummary): string {
  return `Underrated ${roundup.category.toLowerCase()} blogs on ${siteName} this month — hidden gems that deserve more eyes.`;
}

/** A single roundup card — used in both the Top and Underrated columns. */
function RoundupCard({
  roundup,
  variant,
}: {
  roundup: RoundupSummary;
  variant: "top" | "underrated";
}) {
  const isUnderrated = variant === "underrated";
  const to = isUnderrated ? `/blogs/${roundup.slug}/underrated` : `/blogs/${roundup.slug}`;
  return (
    <Link
      to={to}
      className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-4
                 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                 hover:shadow-xl hover:shadow-black/5"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
        <span className="font-semibold uppercase tracking-wide text-gray-700">{roundup.category} |</span>
        <span>{formatMonth(roundup.week_start)}</span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mt-2 group-hover:text-red-600 transition-colors">
        {isUnderrated
          ? `Underrated ${roundup.category} Blogs — ${formatMonth(roundup.week_start)}`
          : roundup.title}
      </h3>
      <p className="text-sm text-gray-500 mt-1.5 flex-1">
        {isUnderrated ? underratedBlurb(roundup) : blurb(roundup)}
      </p>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 mt-3">
        {isUnderrated ? "See underrated" : "Read roundup"}{" "}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Centered empty state for a column with no cards on the current page. */
function EmptyColumn({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[12rem]">
      <div
        className="flex flex-col items-center justify-center text-center w-full max-w-xs
                   rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400">
          <Inbox size={18} />
        </div>
        <p className="text-sm text-gray-500 mt-3">{message}</p>
      </div>
    </div>
  );
}

export default function Blog() {
  useDocumentMeta({
    title: `Blog — ${siteName}`,
    description:
      "Monthly roundups of the best blogs in every category — ranked by real readers. Discover publications worth following.",
    canonicalUrl: `${window.location.origin}/blogs`,
    type: "website",
  });
  useJsonLd(blogIndexSchema());

  const { data: roundups = [], isLoading } = useRoundups();

  // Newest first so the latest roundups land on page 1 of each column.
  const sorted = useMemo(
    () =>
      [...roundups].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [roundups]
  );
  const topRoundups = useMemo(() => sorted.filter((r) => r.count > 0), [sorted]);
  const underratedRoundups = useMemo(
    () => sorted.filter((r) => r.underrated_count > 0),
    [sorted]
  );

  // One shared pagination controls both columns together.
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    Math.ceil(topRoundups.length / ROUNDUPS_PER_PAGE),
    Math.ceil(underratedRoundups.length / ROUNDUPS_PER_PAGE)
  );
  const topPageItems = topRoundups.slice(
    (page - 1) * ROUNDUPS_PER_PAGE,
    page * ROUNDUPS_PER_PAGE
  );
  const underratedPageItems = underratedRoundups.slice(
    (page - 1) * ROUNDUPS_PER_PAGE,
    page * ROUNDUPS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">The {siteName} Blog</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mt-2">
            The best blogs, ranked by readers
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mt-4">
            Every month we round up the top publications in each category — chosen by real upvotes and
            discussion.
          </p>
        </header>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && roundups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-6 text-center">
            <h2 className="text-lg font-bold text-gray-900">Roundups are on the way</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              We publish the top blogs in each category every month. Check back soon — or list your
              publication and be part of the next roundup.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700
                         text-sm font-semibold text-white transition-colors shadow-sm shadow-red-600/20"
            >
              Browse the directory <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {!isLoading && roundups.length > 0 && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Left column — Top blogs */}
            <section className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-900">Top blogs</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">
                The highest-rated blogs in each category this month.
              </p>
              {topPageItems.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {topPageItems.map((roundup) => (
                    <RoundupCard key={roundup.slug} roundup={roundup} variant="top" />
                  ))}
                </div>
              ) : (
                <EmptyColumn message="No more top picks on this page." />
              )}
            </section>

            {/* Right column — Top underrated */}
            <section className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-900">Underrated</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">
                The under scored blogs in each category — hidden gems that deserve more eyes.
              </p>
              {underratedPageItems.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {underratedPageItems.map((roundup) => (
                    <RoundupCard
                      key={`underrated-${roundup.slug}`}
                      roundup={roundup}
                      variant="underrated"
                    />
                  ))}
                </div>
              ) : (
                <EmptyColumn
                  message={
                    underratedRoundups.length > 0
                      ? "No more underrated picks on this page."
                      : "No underrated picks yet — they appear once a category has blogs with least impressions."
                  }
                />
              )}
            </section>
          </div>
          {/* One shared pagination advances both columns together. */}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
