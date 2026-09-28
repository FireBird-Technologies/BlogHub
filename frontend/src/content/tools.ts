import type { FaqItem } from "./seoTypes";

// Free tools at /tools/<slug>. Copy is shared by the React page and the build-time prerender
// (seo/prerender.ts). Every tool requires sign-in to use; the copy stays public so the page can rank.
//
// Target terms, from DataForSEO (US, Sep 2026): "blog name generator" 880/mo (KD 12),
// "newsletter name generator" 210/mo (KD 0).

export type NameKind = "blog" | "newsletter";

export interface ToolSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  ctaPath?: string;
  ctaLabel?: string;
}

export interface ToolDef {
  slug: string;
  kind: NameKind;
  metaTitle: string;
  description: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  primaryKeyword: string;
  sections: ToolSection[];
  faq: FaqItem[];
  relatedPaths: { path: string; label: string }[];
}

export const TOOLS_HUB = {
  path: "/tools",
  metaTitle: "Free Tools for Bloggers and Newsletter Writers | BlogHub",
  description:
    "Free tools for starting and growing a publication: a blog name generator and a newsletter name generator. Sign in free to use them.",
  heroTitle: "Free tools for bloggers and newsletter writers",
  heroDescription: "Name your publication, then list it on BlogHub so readers can find it.",
};

export const TOOLS: ToolDef[] = [
  {
    slug: "blog-name-generator",
    kind: "blog",
    metaTitle: "Blog Name Generator: Free Blog Name Ideas in Seconds | BlogHub",
    description:
      "Free blog name generator. Enter your topic and get dozens of catchy, brandable blog name ideas, then check the domain and list your blog on BlogHub.",
    eyebrow: "Blog name generator",
    heroTitle: "Blog name generator",
    heroDescription:
      "Type the topic you write about and get catchy, brandable blog name ideas in seconds. Keep generating until one sounds like you.",
    primaryKeyword: "blog name generator",
    sections: [
      {
        heading: "How the blog name generator works",
        paragraphs: [
          "Enter one to three words that describe your blog: the topic, the audience, or the feeling you want. The generator combines them with naming patterns that successful blogs use, such as a keyword with a place word (The Frugal Kitchen), a verb phrase (Chasing Espresso), or a compound (Budgetwise).",
          "Pick a style to steer the results, and press generate again for a fresh batch. Every name is built from your own words, so the ideas stay on topic.",
        ],
      },
      {
        heading: "What makes a good blog name",
        paragraphs: ["The best blog names are easy to say out loud, easy to spell after hearing them once, and hint at what the blog is about."],
        bullets: [
          "Keep it under three words and fifteen characters if you can.",
          "Avoid hyphens and numbers that people will mistype.",
          "Leave room to grow: \"Vegan Weeknights\" is narrower than \"The Green Table\".",
          "Check that the .com and the social handles are free before you commit.",
        ],
      },
      {
        heading: "Named it? Get your first readers",
        paragraphs: [
          "A new blog has no traffic and no backlinks. Listing it on BlogHub gives it a permanent, indexable page and puts it in front of readers who are browsing for new blogs to follow.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "List your blog on BlogHub",
      },
    ],
    faq: [
      {
        question: "Is the blog name generator free?",
        answer: "Yes. It is free with a BlogHub account. Sign in with Google and generate as many names as you like.",
      },
      {
        question: "How do I check if a blog name is available?",
        answer:
          "Search the name at a domain registrar to see if the .com is free, then check the handle on the social platforms you plan to use. If the exact name is taken, try adding a short word such as \"the\", \"daily\" or \"hq\".",
      },
      {
        question: "Should my blog name include a keyword?",
        answer:
          "It helps readers understand the blog at a glance, but it matters much less for search rankings than the content itself. A memorable name beats a keyword-stuffed one.",
      },
    ],
    relatedPaths: [
      { path: "/tools/newsletter-name-generator", label: "Newsletter name generator" },
      { path: "/blogs/how-to-start-a-blog-for-beginners", label: "How to start a blog for beginners" },
      { path: "/blogs/best-blogging-platforms", label: "The best blogging platforms compared" },
      { path: "/submit-your-newsletter", label: "Submit your blog to BlogHub" },
    ],
  },
  {
    slug: "newsletter-name-generator",
    kind: "newsletter",
    metaTitle: "Newsletter Name Generator: Free Name Ideas for Substack & beehiiv | BlogHub",
    description:
      "Free newsletter name generator. Enter your topic and get newsletter name ideas that work for Substack, beehiiv, Ghost and any email list.",
    eyebrow: "Newsletter name generator",
    heroTitle: "Newsletter name generator",
    heroDescription:
      "Enter what your newsletter covers and get name ideas that read well in an inbox, from The Weekly Brief style to one-word brands.",
    primaryKeyword: "newsletter name generator",
    sections: [
      {
        heading: "How the newsletter name generator works",
        paragraphs: [
          "Enter your topic in a word or two. The generator pairs it with the naming conventions newsletters use: cadence words (Weekly, Sunday), format words (Brief, Dispatch, Letter, Notes), and short brandable forms that look good as a sender name.",
          "Newsletter names show up in the From line of every email, so the ideas favor names that are short and instantly recognisable in a crowded inbox.",
        ],
      },
      {
        heading: "Tips for naming a newsletter",
        paragraphs: ["Your name is the first thing a subscriber sees in their inbox, every single time."],
        bullets: [
          "Say what readers get: a \"Brief\" promises something short, a \"Letter\" something personal.",
          "Only put a cadence in the name if you will keep it: \"Weekly\" becomes a promise.",
          "Make sure it fits a Substack or beehiiv subdomain without abbreviating.",
          "Read it aloud as a podcast title too, in case the newsletter grows into audio.",
        ],
      },
      {
        heading: "Named it? List it where readers look",
        paragraphs: [
          "Newsletter directories are one of the few places people go specifically to find something new to subscribe to. BlogHub is free, and your listing links straight to your signup page.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "Submit your newsletter",
      },
    ],
    faq: [
      {
        question: "Is the newsletter name generator free?",
        answer: "Yes. It is free with a BlogHub account. Sign in with Google and generate as many names as you need.",
      },
      {
        question: "Can I use these names on Substack?",
        answer:
          "Yes. Check that the matching substack.com subdomain is available when you create the publication, and keep the name short enough to read clearly in the From line.",
      },
      {
        question: "Should a newsletter name include my own name?",
        answer:
          "Personal names work well for opinion and expertise newsletters where readers follow you. Topic names work better if you might add writers later or sell the newsletter one day.",
      },
    ],
    relatedPaths: [
      { path: "/tools/blog-name-generator", label: "Blog name generator" },
      { path: "/blogs/how-to-start-a-newsletter", label: "How to start a newsletter" },
      { path: "/blogs/best-newsletter-platforms", label: "The best newsletter platforms" },
      { path: "/blogs/best-newsletter-directories", label: "Newsletter directories" },
    ],
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
