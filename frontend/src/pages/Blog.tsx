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
  const featured = sorted[0];
  const rest = sorted.slice(1);

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

        {!isLoading && featured && (
          <Link
            to={`/blogs/${featured.slug}`}
            className="group block bg-white border border-gray-200 rounded-2xl
                       p-6 sm:p-10 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                       hover:shadow-xl hover:shadow-black/5 mb-10 sm:mb-14"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
              <span className="font-semibold uppercase tracking-wide text-gray-700">{featured.category} |</span>
              <span className="text-red-600 font-semibold uppercase tracking-wide">Latest roundup</span>
              <span aria-hidden>·</span>
              <span>{formatMonth(featured.week_start)}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mt-4 group-hover:text-red-600 transition-colors">
              {featured.title}
            </h2>
            <p className="text-sm sm:text-lg text-gray-500 mt-3 max-w-2xl">{blurb(featured)}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 mt-5">
              Read roundup <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {!isLoading && rest.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-5">More roundups</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((roundup) => (
                <Link
                  key={roundup.slug}
                  to={`/blogs/${roundup.slug}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-5
                             transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                             hover:shadow-xl hover:shadow-black/5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="font-semibold uppercase tracking-wide text-gray-700">{roundup.category} |</span>
                    <span>{formatMonth(roundup.week_start)}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mt-3 group-hover:text-red-600 transition-colors">
                    {roundup.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 flex-1">{blurb(roundup)}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 mt-4">
                    Read roundup <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
