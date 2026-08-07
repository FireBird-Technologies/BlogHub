import type { FaqItem } from "./seoTypes";

// Copy for the /submit-your-newsletter landing page.
//
// Kept out of the component so the FAQ can be rendered on the page AND emitted as
// FAQPage JSON-LD (seo/schema.ts) without the two drifting apart.
//
// Target terms, from DataForSEO (US, en): "submit newsletter" (110/mo, transactional),
// "newsletter directory"/"newsletter directories" (90/mo, $48.21 CPC),
// "newsletter aggregator" (720/mo, KD 12), "substack directory" (30/mo).
// The SERP for this intent is won by dedicated submission pages — inboxreads.co/submit
// and epirus.vc/newsletter-directory/submit-your-newsletter both rank top 5 — which is
// the format this page mirrors.

export const SUBMIT_NEWSLETTER = {
  path: "/submit-your-newsletter",

  metaTitle: "Submit Your Newsletter — Free Newsletter Directory | BlogHub",
  metaDescription:
    "Submit your newsletter to BlogHub's free directory. List a Substack, beehiiv, Ghost, or self-hosted publication in a minute and get discovery traffic, a permanent listing page, and a link back to your site.",

  benefits: [
    {
      title: "Readers who are actually looking",
      body: "People come to a directory with the intent to subscribe to something new. That's a warmer audience than a social feed, where you're competing with everything else for a scroll.",
    },
    {
      title: "A permanent, indexable page",
      body: "Your listing gets its own page with your title, description, and a link to your publication. It stays up and stays crawlable — a social post is gone in a day.",
    },
    {
      title: "A link back to your site",
      body: "Every listing links out to your publication, so search engines have one more path to your content. Directory links are the standard first move for a new publication with no backlinks yet.",
    },
  ],

  steps: [
    {
      title: "Paste your URL",
      body: "Drop in the link to your newsletter, Substack, or blog. We fetch the title, description, and cover image automatically so there's nothing to type out.",
    },
    {
      title: "Check the preview",
      body: "Edit anything the scrape got wrong, pick the category readers would browse to find you, and add tags that describe what you write about.",
    },
    {
      title: "Publish and get found",
      body: "Your listing goes live on the home page and in your category, where readers can upvote it. Higher-voted publications sit closer to the top of their category.",
    },
  ],

  platforms: [
    "Substack newsletters — paste your yourname.substack.com URL",
    "beehiiv publications, including custom domains",
    "Ghost newsletters and Ghost-hosted blogs",
    "Kit (formerly ConvertKit) and Mailchimp landing pages",
    "Medium publications and personal Medium profiles",
    "Self-hosted WordPress, Hugo, Astro, and static-site blogs",
  ],

  faq: [
    {
      question: "Is it free to submit a newsletter to BlogHub?",
      answer:
        "Yes. Listing a publication is free and always will be — there's no submission fee, no review fee, and no subscription. The only paid thing on the site is the optional featured slot at the top of the home page, which is a separate product you never need to buy to be listed.",
    },
    {
      question: "Do I need a minimum number of subscribers?",
      answer:
        "No. There's no subscriber threshold. A newsletter on issue one can list alongside one with fifty thousand readers — a directory is most useful precisely for publications that don't have an audience yet.",
    },
    {
      question: "Which platforms can I submit from?",
      answer:
        "Any of them. Substack, beehiiv, Ghost, Kit, Mailchimp, Medium, and self-hosted blogs all work the same way, because all we need is a public URL we can fetch a title and description from.",
    },
    {
      question: "How long does approval take?",
      answer:
        "Listings go live as soon as you publish them — there's no queue to sit in. We remove spam and dead links after the fact rather than making every writer wait on a manual review.",
    },
    {
      question: "Do I get a link back to my site?",
      answer:
        "Yes. Your listing page links out to your publication, which gives search engines another route to your content. It's one link, not a magic ranking fix, but it's the kind of link a brand-new publication has no other way to get.",
    },
    {
      question: "What's the difference between a newsletter directory and a newsletter aggregator?",
      answer:
        "A directory lists publications so readers can browse and subscribe on the publisher's own platform — that's what BlogHub is. An aggregator pulls the actual issues into one inbox or feed and readers consume them there. Directories send you subscribers; aggregators tend to keep the reading on their own site.",
    },
    {
      question: "Can I submit more than one publication?",
      answer:
        "Yes. Submit as many as you own. Each one gets its own listing page and its own votes, so a personal blog and a niche newsletter can both be listed under the categories that fit them.",
    },
    {
      question: "Can I edit or remove my listing later?",
      answer:
        "Yes. Publications you submit show up in your profile, where you can update the title, description, category, and tags at any time, or take the listing down entirely.",
    },
  ] satisfies FaqItem[],

  relatedPosts: [
    {
      path: "/blogs/best-newsletter-directories",
      label: "The best newsletter directories to submit your publication to",
    },
    {
      path: "/blogs/how-to-promote-your-newsletter",
      label: "How to promote your newsletter: 11 channels that work without a budget",
    },
    {
      path: "/blogs/how-to-grow-on-substack",
      label: "How to grow on Substack when you're starting from zero",
    },
    {
      path: "/blogs/substack-vs-beehiiv",
      label: "Substack vs beehiiv: which should you publish on?",
    },
  ],
} as const;
