import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/landing/Footer";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { useRoundups } from "../hooks/useRoundups";
import { siteName } from "../content/siteContent";
import { blogIndexSchema } from "../seo/schema";
import type { RoundupSummary } from "../types/models";

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
      className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-5
                 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                 hover:shadow-xl hover:shadow-black/5"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
        <span className="font-semibold uppercase tracking-wide text-gray-700">{roundup.category} |</span>
        <span>{formatMonth(roundup.week_start)}</span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mt-3 group-hover:text-red-600 transition-colors">
        {isUnderrated
          ? `Underrated ${roundup.category} Blogs — ${formatMonth(roundup.week_start)}`
          : roundup.title}
      </h3>
      <p className="text-sm text-gray-500 mt-2 flex-1">
        {isUnderrated ? underratedBlurb(roundup) : blurb(roundup)}
      </p>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 mt-4">
        {isUnderrated ? "See underrated" : "Read roundup"}{" "}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
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

  const sorted = [...roundups].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const topRoundups = sorted.filter((r) => r.count > 0);
  const underratedRoundups = sorted.filter((r) => r.underrated_count > 0);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Left column — Top blogs */}
            <section>
              <h2 className="text-lg font-bold text-gray-900">Top blogs</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">
                The highest-rated blogs in each category this month.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {topRoundups.map((roundup) => (
                  <RoundupCard key={roundup.slug} roundup={roundup} variant="top" />
                ))}
              </div>
            </section>

            {/* Right column — Top underrated */}
            <section>
              <h2 className="text-lg font-bold text-gray-900">Underrated</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">
                The under scored blogs in each category — hidden gems that deserve more eyes.
              </p>
              {underratedRoundups.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {underratedRoundups.map((roundup) => (
                    <RoundupCard
                      key={`underrated-${roundup.slug}`}
                      roundup={roundup}
                      variant="underrated"
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-10 px-6 text-center">
                  <p className="text-sm text-gray-500">
                    No underrated picks yet — they appear once a category has more blogs than fit in
                    its top list.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
