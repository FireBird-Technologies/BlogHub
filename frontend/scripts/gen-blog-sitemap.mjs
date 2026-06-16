// Build-time generator for the blog sitemap.
//
// Reads frontend/src/content/blogPosts.ts and writes public/blog-sitemap.xml so
// that adding a post only requires editing blogPosts.ts — no backend change.
//
// We parse the slug/publishedAt pairs out of the .ts source with a regex rather
// than importing it, so the script stays dependency-free (no tsx/ts-node).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SITE_URL = "https://bloghub.app";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(__dirname, "../src/content/blogPosts.ts");
const outFile = resolve(__dirname, "../public/blog-sitemap.xml");

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
  posts.push({ slug, lastmod: dateMatch ? dateMatch[1] : null });
}

if (posts.length === 0) {
  console.warn("[gen-blog-sitemap] No posts found in blogPosts.ts");
}

const urlEntry = ({ slug, lastmod }) => {
  const lines = [
    "  <url>",
    `    <loc>${SITE_URL}/blogs/${slug}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    "    <changefreq>monthly</changefreq>",
    "    <priority>0.6</priority>",
    "  </url>",
  ];
  return lines.join("\n");
};

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  // The blog index page itself.
  "  <url>",
  `    <loc>${SITE_URL}/blogs</loc>`,
  "    <changefreq>weekly</changefreq>",
  "    <priority>0.6</priority>",
  "  </url>",
  ...posts.map(urlEntry),
  "</urlset>",
  "",
].join("\n");

writeFileSync(outFile, xml, "utf8");
console.log(`[gen-blog-sitemap] Wrote ${posts.length} post(s) to public/blog-sitemap.xml`);
