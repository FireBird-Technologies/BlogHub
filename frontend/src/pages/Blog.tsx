import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/landing/Footer";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { blogPosts, siteName, defaultOgImage } from "../content/siteContent";
import { blogIndexSchema } from "../seo/schema";
import type { BlogPost } from "../content/seoTypes";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function CoverImage({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <div className={`relative bg-gray-100 overflow-hidden ${className ?? ""}`}>
      <img
        src={post.heroImage ?? defaultOgImage}
        alt={post.heroImageAlt ?? post.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = defaultOgImage;
        }}
      />
    </div>
  );
}

export default function Blog() {
  useDocumentMeta({
    title: `Blog — ${siteName}`,
    description:
      "Playbooks on getting your blog discovered, growing a readership, and building a publication people actually read.",
    canonicalUrl: `${window.location.origin}/blogs`,
    type: "website",
  });
  useJsonLd(blogIndexSchema());

  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const featured = sortedPosts[0];
  const latest = sortedPosts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">The {siteName} Blog</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mt-2">
            Grow a readership — real readers, zero cost
          </h1>
          <p className="text-base text-gray-500 mt-3 max-w-2xl">
            Practical writing on discovery, audience growth, and building a publication that earns its readers.
          </p>
        </header>

        {featured && (
          <Link
            to={`/blogs/${featured.slug}`}
            className="group block bg-white border border-gray-200 rounded-xl overflow-hidden
                       transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                       hover:shadow-lg hover:shadow-black/5 mb-10 sm:mb-12"
          >
            <div className="grid md:grid-cols-2">
              <CoverImage post={featured} className="aspect-video md:aspect-auto md:h-full md:min-h-[20rem]" />
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="text-red-600 font-semibold uppercase tracking-wide">{featured.heroEyebrow}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span aria-hidden>·</span>
                  <span>{featured.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 group-hover:text-red-600 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-500 mt-3">{featured.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 mt-5">
                  Read article <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {latest.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Latest posts</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blogs/${post.slug}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden
                             transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300
                             hover:shadow-lg hover:shadow-black/5"
                >
                  <CoverImage post={post} className="aspect-video flex-shrink-0" />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <span className="text-red-600 font-semibold uppercase tracking-wide">{post.category}</span>
                      <span aria-hidden>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-2 group-hover:text-red-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 flex-1">{post.description}</p>
                    <span className="text-xs text-gray-400 mt-4">{formatDate(post.publishedAt)}</span>
                  </div>
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
