import type { BlogPost, FaqItem } from "./seoTypes";

// Source of truth for the BlogHub blog. Add a typed object here and it shows up at
// /blogs (index) and /blogs/<slug> (post) automatically — no CMS, no markdown parsing,
// and NO backend change required.
//
// On `npm run build`, scripts/gen-blog-sitemap.mjs reads this file and regenerates
// public/blog-sitemap.xml, so new posts are crawlable automatically.

// Default 2-question FAQ generator so posts can reuse boilerplate.
function faq(primary: string, variant: string): FaqItem[] {
  return [
    {
      question: `What is ${primary}?`,
      answer: `${primary} is the practice of helping the right readers find your writing. On BlogHub it means listing your publication in a community-curated directory so people browsing a category discover you — no ads, no paywall, just real readers.`,
    },
    {
      question: `How is ${primary} different from ${variant}?`,
      answer: `${variant} usually relies on paid reach or algorithmic luck. ${primary} on BlogHub is community-driven: publications are ranked by genuine upvotes and organised by category, so growth compounds from people who actually want to read what you write.`,
    },
  ];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-get-your-blog-discovered",
    title: "How to Get Your Blog Discovered (Without Paying for Ads)",
    description:
      "A practical playbook for getting real readers to your publication — using directories, categories, and community ranking instead of ad spend.",
    category: "Growth",
    heroImage: "/blog/blog-cover-get-discovered.png",
    heroImageAlt: "A reader browsing a directory of publications on BlogHub",
    publishedAt: "2026-06-10",
    readTime: "7 min read",
    heroEyebrow: "Audience Growth",
    heroTitle: "Get your blog discovered — real readers, zero cost",
    heroDescription:
      "You don't need an ad budget to grow a readership. You need to be in the places where curious readers already look. Here's how to make your publication easy to find.",
    primaryKeyword: "blog discovery",
    keywordVariant: "paid promotion",
    relatedPaths: ["/dashboard", "/category/Tech", "/"],
    sections: [
      {
        heading: "Discovery beats broadcasting",
        paragraphs: [
          "Most writers try to push their work outward — blasting links across social feeds and hoping the algorithm is kind. The problem is that broadcasting competes with everything else fighting for the same scroll.",
          "Discovery flips the model. Instead of chasing attention, you place your publication where people are already searching for something to read. A category page full of motivated readers converts far better than a cold timeline.",
        ],
        bullets: [
          "List your publication in a directory organised by topic.",
          "Pick the category your ideal reader would actually browse.",
          "Let genuine upvotes — not paid reach — decide your rank.",
        ],
      },
      {
        heading: "Make your publication easy to evaluate",
        paragraphs: [
          "When a reader lands on your listing, they decide in seconds whether to click. A clear title, a one-line description that promises a specific payoff, and a representative cover image do most of the work.",
          "Treat your directory listing like a headline test. If the description is vague, even interested readers bounce. If it names the exact thing they'll learn or feel, they stay.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Browse the directory",
      },
      {
        heading: "Compound through community ranking",
        paragraphs: [
          "Paid promotion stops the moment you stop paying. Community ranking compounds: every reader who upvotes your publication nudges it higher, which surfaces it to more readers, who upvote in turn.",
          "The goal isn't a single viral spike — it's a steady climb that keeps sending you readers long after you've published.",
        ],
      },
    ],
    faq: faq("blog discovery", "paid promotion"),
    distributionPlan: [
      {
        channel: "site",
        title: "Get your blog discovered — real readers, zero cost",
        angle: "The on-site pillar post for writers searching how to grow without ads.",
      },
      {
        channel: "substack",
        title: "Discovery beats broadcasting",
        angle: "Short essay reframing growth as placement, not pushing.",
      },
      {
        channel: "video",
        title: "Turn this post into a 90-second explainer",
        angle: "Repurpose the three tactics into a quick video walkthrough.",
      },
    ],
  },
  {
    slug: "what-makes-a-great-publication-listing",
    title: "What Makes a Great Publication Listing",
    description:
      "The anatomy of a listing that earns clicks — title, description, cover, category, and the signals that make readers trust you.",
    category: "Craft",
    heroImage: "/blog/blog-cover-great-listing.png",
    heroImageAlt: "A polished publication card with title, description and cover image",
    publishedAt: "2026-06-12",
    readTime: "6 min read",
    heroEyebrow: "Craft",
    heroTitle: "The anatomy of a publication listing readers actually click",
    heroDescription:
      "A directory listing is a tiny landing page. Get the five core elements right and you'll out-convert publications with far bigger names.",
    primaryKeyword: "publication listing",
    keywordVariant: "social media post",
    relatedPaths: ["/dashboard", "/category/Design", "/"],
    sections: [
      {
        heading: "Five elements that do the heavy lifting",
        paragraphs: [
          "Every strong listing earns the click with the same handful of pieces working together. Miss one and readers hesitate; nail all five and the click feels obvious.",
        ],
        bullets: [
          "Title: specific and benefit-led, not clever-but-vague.",
          "Description: one line that promises a concrete payoff.",
          "Cover image: clean, on-brand, legible at thumbnail size.",
          "Category: the one your ideal reader would actually browse.",
          "Trust signals: a verified badge and real upvotes.",
        ],
      },
      {
        heading: "Write the description like a promise",
        paragraphs: [
          "Readers don't reward effort, they reward clarity. The best descriptions name exactly who the publication is for and what they'll get from reading it.",
          "Cut adjectives that any publication could claim — \"insightful,\" \"high-quality,\" \"must-read.\" Replace them with the specific thing you cover and the reader you cover it for.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "See listings that get it right",
      },
      {
        heading: "Earn trust before you ask for the click",
        paragraphs: [
          "A verified badge and a healthy upvote count tell a first-time visitor that other readers already vouch for you. Those signals lower the perceived risk of clicking an unfamiliar name.",
          "You can't fake your way to durable trust, but you can make the trust you've earned visible. That's half the battle on a page full of choices.",
        ],
      },
    ],
    faq: faq("publication listing", "social media post"),
    distributionPlan: [
      {
        channel: "site",
        title: "The anatomy of a publication listing readers actually click",
        angle: "Evergreen craft post for writers polishing their directory presence.",
      },
      {
        channel: "medium",
        title: "Write your listing description like a promise",
        angle: "Cross-post focused on the description-writing tactic.",
      },
      {
        channel: "video",
        title: "Five elements of a great listing, in 60 seconds",
        angle: "Turn the checklist into a fast, shareable video.",
      },
    ],
  },
];
