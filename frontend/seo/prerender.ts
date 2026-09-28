import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { blogPosts } from "../src/content/blogPosts";
import type { BlogPost } from "../src/content/seoTypes";
import { SUBMIT_NEWSLETTER } from "../src/content/submitNewsletter";
import { TOOLS, TOOLS_HUB, type ToolDef } from "../src/content/tools";

/**
 * Writes static HTML for the content routes (blog, submit page, tools) after `vite build`. Before this, every
 * /blogs/* URL served the same empty SPA shell with the homepage <title>, and the cross-site links in post CTAs
 * existed only after JavaScript ran. The React app replaces #root on load.
 *
 * Files are <route>.html, not <route>/index.html: Cloudflare Pages serves /blogs/x from blogs/x.html with no
 * redirect, while a folder index 308s to /blogs/x/ and disagrees with the canonical.
 */

const SITE = "https://bloghub.app";

type Rendered = { path: string; title: string; description: string; body: string; jsonLd?: object[]; ogType?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const cta = (href?: string, label?: string) => (href && label ? `<p><a href="${esc(href)}">${esc(label)}</a></p>` : "");

const faqLd = (faq: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
});

const faqHtml = (faq: { question: string; answer: string }[]) =>
  faq.length
    ? `<section><h2>Frequently asked questions</h2>${faq.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("")}</section>`
    : "";

const nav = `<header><nav aria-label="Main"><a href="/">BlogHub</a> <a href="/submit-your-newsletter">Submit your newsletter</a> <a href="/blogs">Blog</a> <a href="/tools">Free tools</a></nav></header>`;
const footer = `<footer><nav aria-label="Footer"><a href="/submit-your-newsletter">Submit</a> <a href="/blogs">Blog</a> <a href="/tools">Free tools</a> <a href="/terms">Terms</a> <a href="/privacy">Privacy</a><h2>Also from FireBird</h2><ul><li><a href="https://blog2video.app">Blog2Video: URL to video</a></li><li><a href="https://pdf2vid.com">PDF2Video: document to video</a></li><li><a href="https://notestack.ai">Notestack: research your archive</a></li></ul></nav></footer>`;
const page = (main: string) => `${nav}<main>${main}</main>${footer}`;

const titleFor = (p: string) => {
  const post = blogPosts.find((b) => `/blogs/${b.slug}` === p);
  if (post) return post.title;
  const tool = TOOLS.find((t) => `/tools/${t.slug}` === p);
  if (tool) return tool.heroTitle;
  if (p === SUBMIT_NEWSLETTER.path) return "Submit your newsletter";
  return p;
};

function renderPost(post: BlogPost): Rendered {
  const sections = post.sections
    .map(
      (s) =>
        `<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}${
          s.bullets?.length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""
        }${cta(s.ctaPath, s.ctaLabel)}</section>`,
    )
    .join("");
  const related = post.relatedPaths.length
    ? `<nav aria-label="Related"><h2>Related</h2><ul>${post.relatedPaths
        .map((p) => `<li><a href="${esc(p)}">${esc(titleFor(p))}</a></li>`)
        .join("")}</ul></nav>`
    : "";
  return {
    path: `/blogs/${post.slug}`,
    title: `${post.title} | BlogHub`,
    description: post.description,
    ogType: "article",
    body: page(
      `<article><p>${esc(post.heroEyebrow)}</p><h1>${esc(post.heroTitle)}</h1><p>${esc(post.heroDescription)}</p><time datetime="${post.publishedAt}">${post.publishedAt}</time>${sections}${faqHtml(post.faq)}</article>${related}`,
    ),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        mainEntityOfPage: `${SITE}/blogs/${post.slug}`,
        publisher: { "@type": "Organization", name: "BlogHub" },
      },
      ...(post.faq.length ? [faqLd(post.faq)] : []),
    ],
  };
}

function renderTool(tool: ToolDef): Rendered {
  const sections = tool.sections
    .map(
      (s) =>
        `<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}${
          s.bullets?.length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""
        }${cta(s.ctaPath, s.ctaLabel)}</section>`,
    )
    .join("");
  return {
    path: `/tools/${tool.slug}`,
    title: tool.metaTitle,
    description: tool.description,
    body: page(
      `<article><p>${esc(tool.eyebrow)}</p><h1>${esc(tool.heroTitle)}</h1><p>${esc(tool.heroDescription)}</p><p>Sign in free to use the ${esc(
        tool.eyebrow.toLowerCase(),
      )}.</p>${sections}${faqHtml(tool.faq)}</article><nav aria-label="Related"><h2>Keep going</h2><ul>${tool.relatedPaths
        .map((r) => `<li><a href="${esc(r.path)}">${esc(r.label)}</a></li>`)
        .join("")}</ul></nav>`,
    ),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.heroTitle,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description: tool.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      faqLd(tool.faq),
    ],
  };
}

function routes(): Rendered[] {
  const posts = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return [
    {
      path: "/blogs",
      title: "Blog | BlogHub",
      description: "Guides for growing a blog or newsletter: traffic, directories, Substack growth and repurposing.",
      body: page(
        `<h1>The BlogHub blog</h1>${posts
          .map(
            (p) =>
              `<article><h2><a href="/blogs/${p.slug}">${esc(p.title)}</a></h2><p>${esc(p.description)}</p><time datetime="${p.publishedAt}">${p.publishedAt}</time></article>`,
          )
          .join("")}`,
      ),
    },
    {
      path: SUBMIT_NEWSLETTER.path,
      title: SUBMIT_NEWSLETTER.metaTitle,
      description: SUBMIT_NEWSLETTER.metaDescription,
      body: page(
        `<h1>Submit your newsletter to the BlogHub directory</h1><p>${esc(SUBMIT_NEWSLETTER.metaDescription)}</p>${SUBMIT_NEWSLETTER.benefits
          .map((b) => `<section><h2>${esc(b.title)}</h2><p>${esc(b.body)}</p></section>`)
          .join("")}${faqHtml(SUBMIT_NEWSLETTER.faq)}<ul>${TOOLS.map((t) => `<li><a href="/tools/${t.slug}">${esc(t.heroTitle)}</a></li>`).join("")}</ul>`,
      ),
      jsonLd: [faqLd(SUBMIT_NEWSLETTER.faq)],
    },
    {
      path: TOOLS_HUB.path,
      title: TOOLS_HUB.metaTitle,
      description: TOOLS_HUB.description,
      body: page(
        `<h1>${esc(TOOLS_HUB.heroTitle)}</h1><p>${esc(TOOLS_HUB.heroDescription)}</p><ul>${TOOLS.map(
          (t) => `<li><h2><a href="/tools/${t.slug}">${esc(t.heroTitle)}</a></h2><p>${esc(t.description)}</p></li>`,
        ).join("")}</ul>`,
      ),
    },
    ...TOOLS.map(renderTool),
    ...posts.map(renderPost),
  ];
}

function sanitize(template: string) {
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/gi, "")
    .replace(/<meta\s+property="og:(title|description|url|type)"[\s\S]*?\/>\s*/gi, "")
    .replace(/<meta\s+name="twitter:(title|description)"[\s\S]*?\/>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
}

function head(r: Rendered) {
  const url = `${SITE}${r.path}`;
  return [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${r.ogType ?? "website"}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta name="twitter:title" content="${esc(r.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
    ...(r.jsonLd ?? []).map((ld) => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");
}

export function prerenderPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "bloghub-prerender",
    apply: "build",
    configResolved(c) {
      config = c;
    },
    async closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const template = sanitize(await readFile(path.join(outDir, "index.html"), "utf8"));
      if (!template.includes('<div id="root"></div>')) throw new Error("bloghub-prerender: #root not found in index.html");
      const all = routes();
      for (const r of all) {
        const html = template
          .replace("</head>", `    ${head(r)}\n  </head>`)
          .replace('<div id="root"></div>', `<div id="root">${r.body}</div>`);
        const file = path.join(outDir, `${r.path.slice(1)}.html`);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, html, "utf8");
      }
      config.logger.info(`prerendered ${all.length} content routes`);
    },
  };
}
