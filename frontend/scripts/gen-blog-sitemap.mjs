// Build-time generator for blog sitemap artifacts.
//
// Reads frontend/src/content/blogPosts.ts and writes:
//   1. public/blog-sitemap.xml — served at bloghub.app/blog-sitemap.xml
//   2. backend/app/data/manual_blog_posts.json — consumed by api.bloghub.app/sitemap.xml
//
// Adding a post only requires editing blogPosts.ts, then running `npm run blog-sitemap`
// (also runs automatically on `npm run build`).
//
// We parse the slug/publishedAt pairs out of the .ts source with a regex rather
// than importing it, so the script stays dependency-free (no tsx/ts-node).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SITE_URL = "https://bloghub.app";

// Static, crawlable frontend routes that aren't blog posts. Also mirrored into the
// backend sitemap so api.bloghub.app/sitemap.xml is the single discovery source.
const STATIC_PAGES = [
  { path: "/submit-your-newsletter", changefreq: "monthly", priority: "0.9" },
  { path: "/blogs", changefreq: "weekly", priority: "0.6" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(__dirname, "../src/content/blogPosts.ts");
const outXml = resolve(__dirname, "../public/blog-sitemap.xml");
const outJson = resolve(__dirname, "../../backend/app/data/manual_blog_posts.json");

const source = readFileSync(dataFile, "utf8");

// Match each post object's slug and publishedAt. Order in the file doesn't matter;
// we pair them by walking the source for `slug:` then the next `publishedAt:`.
const posts = [];
const slugRe = /slug:\s*["'`]([^"'`]+)["'`]/g;
let match;
while ((match = slugRe.exec(source)) !== null) {
  const slug = match[1];
  // Find the publishedAt that follows this slug within the same object.
  const rest = source.slice(match.index);
  const dateMatch = rest.match(/publishedAt:\s*["'`](\d{4}-\d{2}-\d{2})["'`]/);
  posts.push({ slug, publishedAt: dateMatch ? dateMatch[1] : null });
}

if (posts.length === 0) {
  console.warn("[gen-blog-sitemap] No posts found in blogPosts.ts");
}

const urlEntry = ({ slug, publishedAt }) => {
  const lines = [
    "  <url>",
    `    <loc>${SITE_URL}/blogs/${slug}</loc>`,
    ...(publishedAt ? [`    <lastmod>${publishedAt}</lastmod>`] : []),
    "    <changefreq>monthly</changefreq>",
    "    <priority>0.6</priority>",
    "  </url>",
  ];
  return lines.join("\n");
};

const staticEntry = ({ path, changefreq, priority }) =>
  [
    "  <url>",
    `    <loc>${SITE_URL}${path}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...STATIC_PAGES.map(staticEntry),
  ...posts.map(urlEntry),
  "</urlset>",
  "",
].join("\n");

writeFileSync(outXml, xml, "utf8");

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify({ staticPages: STATIC_PAGES, posts }, null, 2)}\n`, "utf8");

console.log(
  `[gen-blog-sitemap] Wrote ${STATIC_PAGES.length} static page(s) and ${posts.length} post(s) to public/blog-sitemap.xml`,
);
console.log(`[gen-blog-sitemap] Wrote ${posts.length} post(s) to backend/app/data/manual_blog_posts.json`);
