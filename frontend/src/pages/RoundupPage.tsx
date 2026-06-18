import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/landing/Footer";
import NotFound from "./NotFound";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { useRoundup } from "../hooks/useRoundups";
import { siteName, defaultOgImage } from "../content/siteContent";
import { publicationPath } from "../lib/publicationUrl";
import type { Publication, RoundupDetail } from "../types/models";

function formatMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

/** ItemList structured data so Google understands the ranked list. */
function roundupSchema(roundup: RoundupDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: roundup.title,
    itemListElement: roundup.publications.map((pub, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${window.location.origin}${publicationPath(pub)}`,
      name: pub.title,
    })),
  };
}

function RoundupItem({ pub, position }: { pub: Publication; position: number }) {
  return (
    <li className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:shadow-black/5">
      <div className="flex gap-4 p-5">
        <span className="flex-shrink-0 text-2xl font-extrabold text-gray-300 tabular-nums w-8 text-center">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            to={publicationPath(pub)}
            className="group block text-base font-bold text-gray-900 hover:text-red-600 transition-colors"
          >
            {pub.title}
          </Link>
          {pub.description && (
            <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{pub.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400 mt-3">
            <span>{pub.upvote_count} upvotes</span>
            <span aria-hidden>·</span>
            <span>{pub.comment_count} comments</span>
            <span aria-hidden>·</span>
            <a
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              Visit blog <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function RoundupPage({ slug }: { slug: string | undefined }) {
  const { data: roundup, isLoading, isError } = useRoundup(slug);

  // Hooks run unconditionally; they no-op while loading or on error.
  useDocumentMeta({
    title: roundup ? `${roundup.title} — ${siteName}` : undefined,
    description: roundup
      ? `The top ${roundup.category} blogs on ${siteName} for ${formatMonth(roundup.week_start)}, ranked by reader upvotes and discussion.`
      : undefined,
    canonicalUrl: roundup ? `${window.location.origin}/blogs/${roundup.slug}` : undefined,
    image: defaultOgImage,
    type: "article",
  });
  useJsonLd(roundup ? roundupSchema(roundup) : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-24 bg-gray-200 rounded mt-8" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !roundup) {
    return <NotFound title="Roundup not found" message="This roundup doesn’t exist or has been removed." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          ← All articles
        </Link>

        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Monthly roundup</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mt-2">
            {roundup.title}
          </h1>
          <p className="text-base text-gray-500 mt-3">
            The {roundup.category} blogs readers rated highest on {siteName} for{" "}
            {formatMonth(roundup.week_start)} — ranked by upvotes and discussion.
          </p>
        </header>

        <ol className="mt-8 space-y-4">
          {roundup.publications.map((pub, i) => (
            <RoundupItem key={pub.id} pub={pub} position={i + 1} />
          ))}
        </ol>

        <div className="mt-12 bg-white border border-gray-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">Want your blog in next month’s roundup?</h2>
          <p className="text-sm text-gray-500 mt-1">
            List your publication and let real readers rank it.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700
                       text-sm font-semibold text-white transition-colors shadow-sm shadow-red-600/20"
          >
            Browse the directory <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
