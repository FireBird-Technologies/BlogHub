import {
  siteUrl,
  siteName,
  organizationName,
  organizationLogo,
  defaultOgImage,
} from "../content/siteContent";
import type { BlogPost } from "../content/seoTypes";

// Build JSON-LD structured data for the blog index and individual posts.
// These objects are injected into <head> at runtime via useJsonLd().

const absolute = (path: string) =>
  path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;

const publisher = {
  "@type": "Organization",
  name: organizationName,
  logo: {
    "@type": "ImageObject",
    url: absolute(organizationLogo),
  },
};

/** Schema for the /blogs index page: @type Blog + breadcrumb. */
export function blogIndexSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteName} Blog`,
    url: absolute("/blogs"),
    publisher,
    blogPost: undefined,
    mainEntityOfPage: absolute("/blogs"),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: absolute("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: absolute("/blogs") },
      ],
    },
  };
}

/** Schema for a single post: @type Article + breadcrumb + FAQPage. */
export function blogPostSchema(post: BlogPost) {
  const url = absolute(`/blogs/${post.slug}`);
  const image = absolute(post.heroImage ?? defaultOgImage);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: post.category,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: absolute("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: absolute("/blogs") },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  };

  const faqPage =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  // Return an array graph so both Article and FAQPage are emitted.
  return faqPage ? [article, faqPage] : article;
}
