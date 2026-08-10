import {
  siteUrl,
  siteName,
  organizationName,
  organizationLogo,
  defaultOgImage,
} from "../content/siteContent";
import type { BlogPost } from "../content/seoTypes";
import { SUBMIT_NEWSLETTER } from "../content/submitNewsletter";

// Build JSON-LD structured data for the blog index and individual posts.
// These objects are injected into <head> at runtime via useJsonLd().

const absolute = (path: string) =>
  path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;

// Sibling properties from the same organisation, declared so a search engine
// resolves bloghub.app, blog2video.app, and pdf2vid.com to one entity rather
// than three domains that happen to link to each other. The reciprocal links
// live in each site's footer — see ../lib/blog2video.ts.
const siblingSites = ["https://blog2video.app", "https://pdf2vid.com"];

const publisher = {
  "@type": "Organization",
  name: organizationName,
  logo: {
    "@type": "ImageObject",
    url: absolute(organizationLogo),
  },
  sameAs: siblingSites,
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

/**
 * Schema for /submit-your-newsletter: WebPage + HowTo + FAQPage.
 *
 * HowTo mirrors the on-page "How to submit your newsletter" steps, which is what
 * makes the page eligible for the step-list treatment on a "submit newsletter"
 * SERP; FAQPage reuses the same questions rendered on the page.
 */
export function submitNewsletterSchema() {
  const url = absolute(SUBMIT_NEWSLETTER.path);

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SUBMIT_NEWSLETTER.metaTitle,
    description: SUBMIT_NEWSLETTER.metaDescription,
    url,
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
    publisher,
    primaryImageOfPage: { "@type": "ImageObject", url: absolute(defaultOgImage) },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: absolute("/") },
        { "@type": "ListItem", position: 2, name: "Submit your newsletter", item: url },
      ],
    },
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to submit your newsletter to BlogHub",
    description:
      "List a newsletter, Substack, or blog in BlogHub's free directory in three steps.",
    totalTime: "PT1M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    step: SUBMIT_NEWSLETTER.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.body,
      url: `${url}#step-${i + 1}`,
    })),
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SUBMIT_NEWSLETTER.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return [webPage, howTo, faqPage];
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
