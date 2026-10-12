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

// The static body is for crawlers and link unfurlers, which read the HTML without
// styling it. Browsers would otherwise flash it as raw, unstyled text until React
// mounts and replaces #root, so it is visually hidden (sr-only style, inline because
// the stylesheet may not have loaded yet) while staying in the DOM and readable by
// crawlers and screen readers.
const VISUALLY_HIDDEN =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";

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

// ---- DB-backed routes (publications, categories, roundups) -------------------------------------------------
// Fetched from the public API at build time. Any failure skips these routes and logs a warning: the build must
// never fail because the API is down, and the client still renders them after hydration.
const API = process.env.PRERENDER_API_URL ?? "https://api.bloghub.app";

type ApiPub = { id: string; title: string; description?: string | null; category?: string; url: string; is_unlisted?: boolean };
type ApiRoundup = { slug: string; title: string; category: string; week_start: string; underrated_count: number; publications?: ApiPub[]; underrated?: ApiPub[] };

async function api<T>(p: string): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API}/api${p}`, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`${p} -> ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, attempt * 750));
    }
  }
  throw last;
}

const pubSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
const pubPath = (p: { id: string; title: string }) => {
  const sid = p.id.replace(/-/g, "").slice(0, 8).toLowerCase();
  const slug = pubSlug(p.title);
  return slug ? `/publications/${slug}-${sid}` : `/publications/${sid}`;
};
const monthLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const pubList = (pubs: ApiPub[]) =>
  `<ol>${pubs.map((p) => `<li><h2><a href="${esc(pubPath(p))}">${esc(p.title)}</a></h2>${p.description ? `<p>${esc(p.description.slice(0, 200))}</p>` : ""}</li>`).join("")}</ol>`;

async function dynamicRoutes(): Promise<Rendered[]> {
  const out: Rendered[] = [];

  // Publications: page through the whole directory (50 per page).
  const pubs: ApiPub[] = [];
  let cursor: string | undefined;
  do {
    const q = new URLSearchParams({ limit: "50", sort: "newest", ...(cursor ? { cursor } : {}) });
    const page = await api<{ items: ApiPub[]; next_cursor: string | null }>(`/publications?${q}`);
    pubs.push(...page.items);
    cursor = page.next_cursor ?? undefined;
  } while (cursor && pubs.length < 5000);
  for (const p of pubs.filter((x) => !x.is_unlisted)) {
    const desc = p.description?.trim() || `Read "${p.title}" on BlogHub.`;
    out.push({
      path: pubPath(p),
      title: `${p.title} — BlogHub`,
      description: desc.slice(0, 300),
      ogType: "article",
      body: page(
        `<article><h1>${esc(p.title)}</h1><p>${esc(desc)}</p>${p.category ? `<p>Category: <a href="/category/${encodeURIComponent(p.category)}">${esc(p.category)}</a></p>` : ""}<p><a href="${esc(p.url)}" rel="noopener">Visit ${esc(p.title)}</a></p></article>`,
      ),
    });
  }

  // Category ranking pages: top 50 per category.
  const cats = await api<string[]>("/publications/categories");
  for (const c of cats) {
    const list = await api<{ items: ApiPub[] }>(`/publications?${new URLSearchParams({ limit: "50", category: c, sort: "ranked_global" })}`);
    if (!list.items.length) continue;
    out.push({
      path: `/category/${encodeURIComponent(c)}`,
      title: `${c} publications, ranked — BlogHub`,
      description: `Discover the top-ranked ${c} publications on BlogHub, sorted by community score and updated daily.`,
      body: page(`<h1>${esc(c)}</h1><p>Top-ranked ${esc(c)} publications on BlogHub.</p>${pubList(list.items.filter((x) => !x.is_unlisted))}`),
    });
  }

  // Monthly roundups and their /underrated companions.
  const roundups = await api<ApiRoundup[]>("/roundups");
  for (const r of roundups) {
    const d = await api<ApiRoundup>(`/roundups/${r.slug}`);
    const month = monthLabel(d.week_start);
    out.push({
      path: `/blogs/${d.slug}`,
      title: `${d.title} — BlogHub`,
      description: `The top ${d.category} blogs on BlogHub for ${month}, ranked by reader upvotes and discussion.`,
      ogType: "article",
      body: page(`<h1>${esc(d.title)}</h1>${pubList(d.publications ?? [])}${d.underrated?.length ? `<p><a href="/blogs/${d.slug}/underrated">Underrated ${esc(d.category)} blogs for ${month}</a></p>` : ""}`),
    });
    if (d.underrated?.length) {
      out.push({
        path: `/blogs/${d.slug}/underrated`,
        title: `Underrated ${d.category} Blogs — ${month} — BlogHub`,
        description: `Underrated ${d.category} blogs on BlogHub for ${month} — great reads that haven't found their audience yet.`,
        ogType: "article",
        body: page(`<h1>Underrated ${esc(d.category)} blogs — ${month}</h1>${pubList(d.underrated)}<p><a href="/blogs/${d.slug}">Top ${esc(d.category)} blogs for ${month}</a></p>`),
      });
    }
  }
  return out;
}

function routes(): Rendered[] {
  const posts = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return [
    {
      path: "/",
      title: "BlogHub: Free Blog & Newsletter Directory",
      description:
        "Submit your blog, newsletter, or Substack to BlogHub's free directory. Get discovered by real readers, drive traffic to your site, and earn a link back — no listing fee, no subscriber minimum.",
      body: page(
        `<h1>BlogHub: the free blog and newsletter directory</h1><p>Submit your blog, newsletter, or Substack to BlogHub's free directory. Get discovered by real readers, drive traffic to your site, and earn a link back. No listing fee, no subscriber minimum.</p><p><a href="/submit-your-newsletter">Submit your newsletter</a></p><section><h2>Guides for growing a blog or newsletter</h2><ul><li><a href="/blogs/substack-alternatives">Substack alternatives and competitors</a></li><li><a href="/blogs/substack-vs-beehiiv">Substack vs beehiiv</a></li><li><a href="/blogs/best-newsletter-platforms">Best newsletter platforms</a></li><li><a href="/blogs/best-newsletter-directories">Best newsletter directories</a></li><li><a href="/blogs">All guides</a></li></ul></section><section><h2>Browse by category</h2><ul>${["Tech", "Business", "Finance", "Science", "Culture", "Health", "Education", "Design"].map((c) => `<li><a href="/category/${c}">${c} publications</a></li>`).join("")}</ul></section><section><h2>Free tools</h2><ul>${TOOLS.map((t) => `<li><a href="/tools/${t.slug}">${esc(t.heroTitle)}</a></li>`).join("")}</ul></section>`,
      ),
      jsonLd: [
        { "@context": "https://schema.org", "@type": "WebSite", name: "BlogHub", url: SITE },
      ],
    },
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
      let dynamic: Rendered[] = [];
      try {
        dynamic = await dynamicRoutes();
      } catch (e) {
        config.logger.warn(`bloghub-prerender: skipped DB-backed routes (${(e as Error).message})`);
      }
      const all = [...routes(), ...dynamic];
      for (const r of all) {
        const html = template
          .replace("</head>", `    ${head(r)}\n  </head>`)
          .replace('<div id="root"></div>', `<div id="root"><div style="${VISUALLY_HIDDEN}">${r.body}</div></div>`);
        const file = path.join(outDir, r.path === "/" ? "index.html" : `${r.path.slice(1)}.html`);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, html, "utf8");
      }
      config.logger.info(`prerendered ${all.length} content routes`);
    },
  };
}
