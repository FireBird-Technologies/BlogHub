// Blog content contract — mirrored from blog2video's data-driven blog system.
// The blog is NOT markdown-driven at runtime: every post is a typed object in the
// `blogPosts` array (see blogPosts.ts), and pages map over it to render.

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  component?: string; // optional lazy-loaded demo component key (unused in BlogHub)
  ctaPath?: string;
  ctaLabel?: string;
}

export interface DistributionAsset {
  channel: "site" | "substack" | "medium" | "video";
  title: string;
  angle: string;
}

export interface BlogPost {
  slug: string; // URL: /blogs/<slug>
  title: string;
  description: string; // meta description / card subtitle
  category: string;
  heroImage?: string; // "/blog/...png" under public/
  heroImageAlt?: string;
  publishedAt: string; // "YYYY-MM-DD" (sorting + schema dates)
  readTime: string; // "6 min read"
  heroEyebrow: string;
  heroTitle: string; // on-page H1 (may differ from title)
  heroDescription: string;
  primaryKeyword: string;
  keywordVariant: string;
  relatedPaths: string[]; // internal links in sidebar
  sections: BlogSection[];
  faq: FaqItem[]; // rendered + emitted as FAQ JSON-LD
  distributionPlan: DistributionAsset[];
}
