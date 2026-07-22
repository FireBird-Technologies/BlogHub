import { LEGAL } from "../constants/legal";
import { blogPosts } from "./blogPosts";
import type { BlogPost } from "./seoTypes";

export { blogPosts };
export type { BlogPost };

// Site-wide constants used by the blog pages and JSON-LD schema.
export const siteUrl = LEGAL.siteUrl; // "https://bloghub.app"
export const siteName = LEGAL.siteName; // "BlogHub"
export const organizationName = "FireBird Technologies";
export const organizationLogo = "/assets/Bloghub-logo.png";
export const defaultOgImage = "/assets/landing/new-embed-image.jpg";

/** Resolve a post by slug, or undefined if it doesn't exist. */
export function getBlogPost(slug: string | undefined): BlogPost | undefined {
  if (!slug) return undefined;
  return blogPosts.find((post) => post.slug === slug);
}

/** All public, crawlable paths (the blog index + every post). */
export function getPublicPaths(): string[] {
  return ["/blogs", ...blogPosts.map((post) => `/blogs/${post.slug}`)];
}

export interface PublicLinkDetail {
  path: string;
  label: string;
  description: string;
}

// Friendly labels/descriptions for internal links shown in the post sidebar.
// Seeded with BlogHub's real routes; blog posts are resolved dynamically below.
const PUBLIC_LINK_DETAILS: PublicLinkDetail[] = [
  { path: "/", label: "BlogHub Home", description: "Discover great publications, curated by the community." },
  { path: "/dashboard", label: "Browse Publications", description: "The full directory, ranked by community upvotes." },
  { path: "/blogs", label: "BlogHub Blog", description: "Playbooks on growing a readership and building a publication." },
  { path: "/category/Tech", label: "Tech Publications", description: "Top-ranked technology publications on BlogHub." },
  { path: "/category/Design", label: "Design Publications", description: "Top-ranked design publications on BlogHub." },
];

/** Returns the seeded link details (extend as more routes need friendly labels). */
export function getPublicLinkDetails(): PublicLinkDetail[] {
  return PUBLIC_LINK_DETAILS;
}

/**
 * Resolve a list of internal paths into labelled links for the sidebar.
 * Blog posts resolve from their own data; known routes from PUBLIC_LINK_DETAILS;
 * anything else falls back to a derived label.
 */
export function getStructuredInternalLinks(paths: string[]): PublicLinkDetail[] {
  return paths.map((path) => {
    const seeded = PUBLIC_LINK_DETAILS.find((link) => link.path === path);
    if (seeded) return seeded;

    if (path.startsWith("/blogs/")) {
      const post = getBlogPost(path.replace("/blogs/", ""));
      if (post) return { path, label: post.title, description: post.description };
    }

    if (path.startsWith("/category/")) {
      const name = decodeURIComponent(path.replace("/category/", ""));
      return { path, label: `${name} Publications`, description: `Top-ranked ${name} publications on BlogHub.` };
    }

    return { path, label: path.replace(/^\//, "") || "Home", description: "" };
  });
}
