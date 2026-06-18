import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/landing/Footer";
import RoundupPage from "./RoundupPage";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import {
  blogPosts,
  getBlogPost,
  getStructuredInternalLinks,
  siteName,
  defaultOgImage,
} from "../content/siteContent";
import { blogPostSchema } from "../seo/schema";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const channelLabels: Record<string, string> = {
  site: "On-site",
  substack: "Substack",
  medium: "Medium",
  video: "Video",
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  // Hooks must run unconditionally (Rules of Hooks); they no-op when there's no post.
  useDocumentMeta({
    title: post ? `${post.title} — ${siteName}` : undefined,
    description: post?.description,
    canonicalUrl: post ? `${window.location.origin}/blogs/${post.slug}` : undefined,
    image: post?.heroImage ?? defaultOgImage,
    type: "article",
  });
  useJsonLd(post ? blogPostSchema(post) : null);

  // Not a hand-written marketing post → it's an auto-generated weekly roundup
  // (or a 404, which RoundupPage resolves once the API responds).
  if (!post) {
    return <RoundupPage slug={slug} />;
  }

  const relatedLinks = getStructuredInternalLinks(post.relatedPaths);
  const moreArticles = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          ← All articles
        </Link>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_18rem] gap-10">
          {/* Article */}
          <article>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">{post.heroEyebrow}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mt-2">
              {post.heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mt-4">{post.heroDescription}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 mt-5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {post.category}
              </span>
              <span aria-hidden>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span aria-hidden>·</span>
              <span>{post.readTime}</span>
            </div>

            <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mt-6 border border-gray-200">
              <img
                src={post.heroImage ?? defaultOgImage}
                alt={post.heroImageAlt ?? post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = defaultOgImage;
                }}
              />
            </div>

            {post.sections.map((section, i) => (
              <section key={i} className="mt-10">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{section.heading}</h2>
                {section.paragraphs.map((para, j) => (
                  <p key={j} className="text-[15px] leading-7 text-gray-700 mt-4">
                    {para}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((bullet, k) => (
                      <li key={k} className="flex gap-2.5 text-[15px] leading-7 text-gray-700">
                        <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" aria-hidden />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.ctaPath && section.ctaLabel && (
                  <Link
                    to={section.ctaPath}
                    className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700
                               text-sm font-semibold text-white transition-colors shadow-sm shadow-red-600/20"
                  >
                    {section.ctaLabel} <ArrowRight size={15} />
                  </Link>
                )}
              </section>
            ))}

            {/* Distribution Plan */}
            {post.distributionPlan.length > 0 && (
              <section className="mt-12 bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900">Distribution plan</h2>
                <p className="text-sm text-gray-500 mt-1">How we’d repurpose this piece across channels.</p>
                <div className="mt-4 space-y-3">
                  {post.distributionPlan.map((asset, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                                       bg-red-50 text-red-700 border border-red-200">
                        {channelLabels[asset.channel] ?? asset.channel}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{asset.title}</p>
                        <p className="text-sm text-gray-500">{asset.angle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {post.faq.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Frequently asked questions</h2>
                <div className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
                  {post.faq.map((item, i) => (
                    <div key={i} className="py-5">
                      <h3 className="text-base font-semibold text-gray-900">{item.question}</h3>
                      <p className="text-[15px] leading-7 text-gray-700 mt-2">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
            {relatedLinks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Related pages</h2>
                <ul className="mt-3 space-y-3">
                  {relatedLinks.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="group block">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                          {link.label}
                        </span>
                        {link.description && <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {moreArticles.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">More articles</h2>
                <ul className="mt-3 space-y-4">
                  {moreArticles.map((other) => (
                    <li key={other.slug}>
                      <Link to={`/blogs/${other.slug}`} className="group block">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                          {other.title}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {other.category} · {other.readTime}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
