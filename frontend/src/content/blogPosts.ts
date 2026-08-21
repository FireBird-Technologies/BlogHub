import type { BlogPost, DistributionAsset } from "./seoTypes";

// Source of truth for the BlogHub blog. Add a typed object here and it shows up at
// /blogs (index) and /blogs/<slug> (post) automatically — no CMS, no markdown parsing,
// and NO backend change required.
//
// On `npm run build` (or `npm run blog-sitemap`), scripts/gen-blog-sitemap.mjs
// regenerates public/blog-sitemap.xml and backend/app/data/manual_blog_posts.json
// so the API sitemap at /sitemap.xml lists every post automatically.
//
// The posts below target keyword gaps surfaced with the DataForSEO API — low-
// difficulty, high-intent search terms that BlogHub's readers (writers growing a
// publication) actually type into Google. Each post's `primaryKeyword` is the term
// it's built to rank for.

/** Standard repurposing plan tail — most posts end with a blog-to-video angle. */
function videoAsset(title: string, angle: string): DistributionAsset {
  return { channel: "video", title, angle };
}

export const blogPosts: BlogPost[] = [
  // ── Growth & discovery ───────────────────────────────────────────────────
  {
    slug: "how-to-get-traffic-to-your-blog",
    title: "How to Get Traffic to Your Blog: 7 Channels That Actually Work",
    description:
      "A channel-by-channel playbook for getting real traffic to your blog — search, directories, communities, and repurposing — without paying for ads.",
    category: "Growth",
    publishedAt: "2026-06-15",
    readTime: "8 min read",
    heroEyebrow: "Audience Growth",
    heroTitle: "How to get traffic to your blog",
    heroDescription:
      "Traffic is not one thing you switch on — it's a handful of channels you stack. Here are the seven that reliably send readers to a small blog, ranked by effort-to-payoff.",
    primaryKeyword: "how to get traffic to your blog",
    keywordVariant: "buying ads",
    relatedPaths: ["/dashboard", "/blogs/how-to-promote-your-blog-for-free", "/blogs/best-blog-directories"],
    sections: [
      {
        heading: "Start with the channels you can control",
        paragraphs: [
          "Most traffic advice starts with search engine optimisation, which is powerful but slow — it can take months for a new blog to rank. Before that compounding kicks in, you want channels where you control the outcome: places you can submit to today and get a reader tomorrow.",
          "Directories, niche communities, and your own email list are the fastest levers. They don't depend on an algorithm deciding you're worthy; they depend on you showing up where motivated readers already gather.",
        ],
        bullets: [
          "List your blog in a topic directory so browsers in your category find you.",
          "Answer questions in one or two communities where your readers already hang out.",
          "Capture emails from day one so every visit can become a repeat visit.",
        ],
      },
      {
        heading: "Then let search compound in the background",
        paragraphs: [
          "Search is the channel that keeps paying long after you publish. The trick is to write for specific questions rather than broad topics — a post that answers exactly what someone typed will out-rank a vague overview that tries to cover everything.",
          "Pick one clear keyword per post, put it in the title and first paragraph, and answer the question completely. You don't need a hundred posts; you need ten that each own a specific search.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "List your blog on BlogHub",
      },
      {
        heading: "Multiply every post across formats",
        paragraphs: [
          "The biggest waste in blogging is publishing once and moving on. A single post can become a short video, a handful of social snippets, and an email — each reaching people who would never have found the original article.",
          "Repurposing isn't extra content; it's extra distribution for content you already made. Turning a post into a 60-second video, in particular, opens a whole channel where written-word blogs usually have no presence.",
        ],
      },
    ],
    faq: [
      {
        question: "How long does it take to get traffic to a new blog?",
        answer:
          "Directory and community traffic can arrive within days. Search traffic typically takes three to six months to build as pages age and earn links, which is why you stack fast channels on top of the slow one rather than waiting for search alone.",
      },
      {
        question: "How much traffic do I need before it matters?",
        answer:
          "Far less than you think. A few hundred genuinely interested readers a month is enough to build an email list, get feedback, and start compounding. Focus on the right readers before you chase big numbers.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to get traffic to your blog",
        angle: "The pillar post other growth articles link back to.",
      },
      {
        channel: "substack",
        title: "The seven channels I'd stack for a brand-new blog",
        angle: "A personal-essay version aimed at newsletter subscribers.",
      },
      videoAsset("Get blog traffic: 7 channels in 90 seconds", "Turn the seven channels into a fast, shareable explainer."),
    ],
  },
  {
    slug: "how-to-promote-your-blog-for-free",
    title: "How to Promote Your Blog for Free (12 Tactics, No Ad Budget)",
    description:
      "Twelve genuinely free ways to promote your blog — from directories and communities to repurposing and internal linking — that don't need a marketing budget.",
    category: "Growth",
    publishedAt: "2026-06-17",
    readTime: "7 min read",
    heroEyebrow: "Promotion",
    heroTitle: "How to promote your blog for free",
    heroDescription:
      "You do not need an ad budget to get read. You need to place your writing where curious people already look, and to make each post work harder once it's live.",
    primaryKeyword: "how to promote your blog for free",
    keywordVariant: "paid advertising",
    relatedPaths: ["/dashboard", "/blogs/how-to-get-traffic-to-your-blog", "/blogs/where-to-share-your-blog-posts"],
    sections: [
      {
        heading: "Free promotion is placement, not shouting",
        paragraphs: [
          "The instinct is to broadcast — post the link everywhere and hope. But broadcasting competes with everything else in the feed, and a cold link from an unknown name rarely wins that fight.",
          "Free promotion works when you put your post in front of people who were already looking for it: a category directory, a subreddit about your topic, a relevant answer thread. Placement beats volume every time.",
        ],
        bullets: [
          "Submit your blog to a curated directory in your niche.",
          "Share posts in communities where the topic is genuinely on-topic.",
          "Add internal links so each new post lifts your older ones.",
          "Repurpose posts into short video and social snippets.",
        ],
      },
      {
        heading: "Make your best posts easy to find twice",
        paragraphs: [
          "A directory listing is a tiny landing page that keeps sending readers long after you submit it. Write the description like a promise — name exactly who the post is for and what they'll get.",
          "The same discipline helps on your own site: a clear title and a one-line summary decide whether a browsing reader clicks. Vague and clever loses to specific and useful.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Add your blog to the directory",
      },
      {
        heading: "Turn one post into five pieces",
        paragraphs: [
          "Every post you publish can be sliced into a short video, two or three social posts, and a section of your next newsletter. That's four extra shots at reaching a new reader for zero extra writing.",
          "Video is the highest-leverage of these because it reaches an audience most text blogs never touch — and tools like blog2video.app now make turning a post into a clip a few-minute job rather than an afternoon.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the single most effective free way to promote a blog?",
        answer:
          "Getting listed where your ideal reader already browses — a niche directory or an active community. It puts you in front of intent, not just eyeballs, so a small amount of reach converts far better than a broad blast.",
      },
      {
        question: "Is it worth promoting a blog on social media?",
        answer:
          "Yes, but as repurposed snippets rather than bare links. Pull a quote, a stat, or a short clip from the post and let that earn the click. Naked links tend to get buried by the algorithm.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to promote your blog for free",
        angle: "Evergreen how-to for writers without a budget.",
      },
      {
        channel: "medium",
        title: "12 free ways to get your blog read",
        angle: "Cross-post to reach Medium's built-in audience.",
      },
      videoAsset("Promote your blog for free: 12 tactics", "Condense the list into a quick tips video."),
    ],
  },
  {
    slug: "how-to-grow-your-blog-audience",
    title: "How to Grow Your Blog Audience Without Burning Out",
    description:
      "A sustainable system for growing a blog audience — consistency, a clear niche, community, and repurposing — instead of chasing viral spikes.",
    category: "Growth",
    publishedAt: "2026-06-19",
    readTime: "7 min read",
    heroEyebrow: "Audience Growth",
    heroTitle: "How to grow your blog audience",
    heroDescription:
      "Audience growth is less about a single viral hit and more about a system that keeps sending you the right readers, week after week, without exhausting you.",
    primaryKeyword: "how to grow your blog audience",
    keywordVariant: "going viral",
    relatedPaths: ["/dashboard", "/blogs/how-to-get-your-first-1000-blog-readers", "/blogs/build-email-list-from-your-blog"],
    sections: [
      {
        heading: "Pick a niche narrow enough to own",
        paragraphs: [
          "A blog about everything is a blog for no one. The fastest-growing small blogs pick a lane specific enough that a reader instantly knows whether it's for them — and tells a friend who fits.",
          "Narrow feels limiting but it's the opposite: it makes you findable, quotable, and recommendable. You can always widen later, once a core audience trusts you.",
        ],
        bullets: [
          "Define the one reader you're writing for in a single sentence.",
          "Publish on a cadence you can sustain for a year, not a month.",
          "Send everyone to one place to subscribe so growth accumulates.",
        ],
      },
      {
        heading: "Convert visitors into subscribers",
        paragraphs: [
          "Traffic that leaves and never comes back is a leaky bucket. The point of every channel — search, directories, social — is to move a reader one step closer to subscribing, because subscribers are the audience you actually own.",
          "Ask early and ask clearly. A simple, specific promise of what they'll get by subscribing beats a generic 'sign up for updates' every time.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get discovered on BlogHub",
      },
      {
        heading: "Let community ranking compound",
        paragraphs: [
          "Paid reach stops the moment you stop paying. Community ranking compounds: every reader who upvotes your publication nudges it higher, which surfaces it to more readers, who upvote in turn.",
          "The goal isn't one spike — it's a steady climb that keeps working while you sleep, focus on writing, or take a week off.",
        ],
      },
    ],
    faq: [
      {
        question: "How often should I publish to grow an audience?",
        answer:
          "Whatever you can sustain indefinitely. One good post a week beats five in a burst followed by silence. Consistency signals reliability to both readers and search engines.",
      },
      {
        question: "Should I focus on subscribers or page views?",
        answer:
          "Subscribers. Page views are borrowed attention that vanishes; subscribers are an audience you can reach again on your own terms. Optimise every visit toward a subscribe.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to grow your blog audience",
        angle: "Strategy pillar linking to the tactical growth posts.",
      },
      {
        channel: "substack",
        title: "The niche-first way to grow a readership",
        angle: "Essay on why narrow beats broad for small blogs.",
      },
      videoAsset("Grow your blog audience: the system", "A short walkthrough of the niche-to-subscriber loop."),
    ],
  },
  {
    slug: "how-to-get-more-blog-readers",
    title: "How to Get More Blog Readers: Fix the Leaks First",
    description:
      "Before chasing more traffic, plug the leaks costing you readers — weak titles, no subscribe path, and posts that never get repurposed.",
    category: "Growth",
    publishedAt: "2026-06-21",
    readTime: "6 min read",
    heroEyebrow: "Audience Growth",
    heroTitle: "How to get more blog readers",
    heroDescription:
      "More readers usually isn't a traffic problem — it's a conversion problem. Fix what happens after someone lands before you spend energy sending more people.",
    primaryKeyword: "how to get more blog readers",
    keywordVariant: "chasing more traffic",
    relatedPaths: ["/dashboard", "/blogs/how-to-write-a-catchy-blog-title", "/blogs/how-to-get-traffic-to-your-blog"],
    sections: [
      {
        heading: "Your title is doing most of the work",
        paragraphs: [
          "In a directory, a search result, or a feed, the title is the whole pitch. A specific, benefit-led title can double the click-through of an identical post with a vague one.",
          "Say what the reader gets and for whom. Cut cleverness that hides the payoff — readers reward clarity, not wordplay.",
        ],
        bullets: [
          "Lead with the concrete outcome the reader wants.",
          "Include the exact phrase people search for.",
          "Keep it scannable — front-load the important words.",
        ],
      },
      {
        heading: "Give readers a reason to come back",
        paragraphs: [
          "A reader who enjoys one post and then forgets you exist is a reader you have to re-earn from scratch. A single clear invitation to subscribe turns a one-time visit into a relationship.",
          "Place the ask where attention peaks — right after the moment the post delivers on its promise — and tell them specifically what they'll get.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Reach new readers on BlogHub",
      },
      {
        heading: "Reach readers who don't read blogs",
        paragraphs: [
          "Some of your best future readers never browse blogs at all — they watch short videos. Repurposing a post into a clip meets them where they are and routes them back to your writing.",
          "It's the same idea in a new format: one piece of thinking, several front doors.",
        ],
      },
    ],
    faq: [
      {
        question: "Why is my blog getting visits but no loyal readers?",
        answer:
          "Usually there's no clear next step. Visitors read and leave because nothing invites them to subscribe or explore a related post. Add one obvious subscribe path and a couple of internal links.",
      },
      {
        question: "Do catchy titles really matter that much?",
        answer:
          "Yes. The title is the only part most people see before deciding to click. A weak title caps the reach of even excellent writing, because the writing never gets opened.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to get more blog readers",
        angle: "Conversion-focused counterpart to the traffic posts.",
      },
      {
        channel: "medium",
        title: "Get more readers by fixing leaks, not chasing traffic",
        angle: "Reframes growth as retention for a Medium audience.",
      },
      videoAsset("Get more blog readers: plug the leaks", "Turn the three fixes into a quick video."),
    ],
  },
  {
    slug: "why-is-my-blog-not-getting-traffic",
    title: "Why Is My Blog Not Getting Traffic? 8 Common Reasons",
    description:
      "The eight reasons new blogs get no traffic — from targeting the wrong keywords to being invisible in directories — and how to fix each one.",
    category: "Growth",
    publishedAt: "2026-06-23",
    readTime: "7 min read",
    heroEyebrow: "Diagnosis",
    heroTitle: "Why is my blog not getting traffic?",
    heroDescription:
      "If you're publishing and hearing crickets, the cause is almost always one of a short list of fixable problems. Here's how to find yours.",
    primaryKeyword: "why is my blog not getting traffic",
    keywordVariant: "giving up on blogging",
    relatedPaths: ["/dashboard", "/blogs/blog-seo-for-beginners", "/blogs/best-blog-directories"],
    sections: [
      {
        heading: "You're invisible, not uninteresting",
        paragraphs: [
          "Most no-traffic blogs aren't bad — they're undiscovered. If the only way to find a post is to already know the URL, no amount of quality will save it.",
          "The fix is distribution: get listed where readers browse your topic, and target searches real people make. Discovery is a solvable problem, and it's usually the whole problem.",
        ],
        bullets: [
          "You never submitted your blog anywhere readers browse.",
          "Your posts target topics nobody searches for.",
          "Titles are clever but not clickable.",
          "There are no internal links tying posts together.",
        ],
      },
      {
        heading: "You're writing for topics, not questions",
        paragraphs: [
          "Search traffic goes to pages that answer a specific question. A post titled after a broad topic competes with everyone; a post that answers an exact query can win even from a brand-new site.",
          "Use a keyword tool to confirm people actually search your angle, then answer that question better than the current results.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Make your blog discoverable",
      },
      {
        heading: "You published once and stopped promoting",
        paragraphs: [
          "Hitting publish is the start of a post's life, not the end. The posts that get traffic are the ones that get repurposed, shared, and linked to for weeks afterward.",
          "Give each post a second life as a video or social snippet and you multiply its chances of being found.",
        ],
      },
    ],
    faq: [
      {
        question: "How long before a new blog should expect traffic?",
        answer:
          "Directory and community traffic can come within days. Meaningful search traffic usually takes three to six months. If you're getting nothing at all after a few weeks, the issue is distribution, not patience.",
      },
      {
        question: "Is my blog not getting traffic because of SEO?",
        answer:
          "Partly, but not only. SEO is the slow channel. If you also have no directory listings, no community presence, and no repurposing, you've left the fast channels untouched too.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Why is my blog not getting traffic?",
        angle: "Diagnostic post capturing high-intent frustrated searchers.",
      },
      {
        channel: "substack",
        title: "The real reason your blog gets no traffic",
        angle: "Empathetic essay for discouraged writers.",
      },
      videoAsset("8 reasons your blog gets no traffic", "A punchy checklist video."),
    ],
  },
  {
    slug: "how-to-get-your-blog-noticed",
    title: "How to Get Your Blog Noticed in a Crowded Niche",
    description:
      "Practical ways to get your blog noticed — a sharp angle, the right directories, community credibility, and repurposing — even in a saturated topic.",
    category: "Growth",
    publishedAt: "2026-06-25",
    readTime: "6 min read",
    heroEyebrow: "Visibility",
    heroTitle: "How to get your blog noticed",
    heroDescription:
      "Getting noticed isn't about being the loudest. It's about being unmistakably for someone, and being present where that someone already looks.",
    primaryKeyword: "how to get your blog noticed",
    keywordVariant: "waiting to be found",
    relatedPaths: ["/dashboard", "/blogs/how-to-get-traffic-to-your-blog", "/blogs/where-to-share-your-blog-posts"],
    sections: [
      {
        heading: "Have a point of view, not just posts",
        paragraphs: [
          "In a crowded niche, a neutral summary of what everyone already agrees on disappears. A clear point of view — a stance, a method, a strong recommendation — is what gets quoted and remembered.",
          "You don't have to be contrarian for its own sake. You have to be willing to actually recommend something instead of hedging.",
        ],
        bullets: [
          "Pick a stance and defend it in each post.",
          "Be the blog for a specific reader, not a general one.",
          "Show up consistently so people learn to expect you.",
        ],
      },
      {
        heading: "Be where discovery happens",
        paragraphs: [
          "Readers notice blogs in the places built for browsing — directories, roundups, and community rankings — far more than in an endless scroll. Getting listed puts you in the path of people actively looking.",
          "A community-ranked directory is especially powerful because the vouching is visible: upvotes and a healthy listing tell newcomers other readers already trust you.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get noticed on BlogHub",
      },
      {
        heading: "Show up in formats your rivals ignore",
        paragraphs: [
          "If every blog in your niche only publishes text, a short video is an open lane. Repurposing a post into a clip gets you noticed by an audience your competitors aren't even reaching.",
          "Same insight, new surface — and a link back to the writing for anyone who wants the depth.",
        ],
      },
    ],
    faq: [
      {
        question: "How do I get noticed if my niche is already crowded?",
        answer:
          "Go narrower and take a clearer stance. A crowded niche is full of neutral overviews; a specific angle for a specific reader stands out precisely because most competitors are trying to appeal to everyone.",
      },
      {
        question: "Does getting listed in a directory really help visibility?",
        answer:
          "Yes. Directories concentrate readers who are in a browsing, discovering mindset. A good listing puts you in front of that intent instead of hoping to interrupt someone mid-scroll.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to get your blog noticed",
        angle: "Visibility pillar for writers in saturated topics.",
      },
      {
        channel: "medium",
        title: "How to stand out in a crowded blogging niche",
        angle: "Cross-post emphasising point of view.",
      },
      videoAsset("Get your blog noticed: 3 moves", "Short video on angle, placement, and format."),
    ],
  },
  // ── Directories & distribution ───────────────────────────────────────────
  {
    slug: "best-blog-directories",
    title: "The Best Blog Directories to Submit Your Blog To (2026)",
    description:
      "A guide to the best blog directories for getting discovered — what makes a directory worth your time, and how to write a listing that earns clicks.",
    category: "Distribution",
    publishedAt: "2026-06-27",
    readTime: "7 min read",
    heroEyebrow: "Directories",
    heroTitle: "The best blog directories to get discovered",
    heroDescription:
      "A good directory puts your blog in front of readers who are actively browsing your topic. Here's how to tell the good ones from the dead ones — and how to stand out once you're in.",
    primaryKeyword: "best blog directories",
    keywordVariant: "spammy link lists",
    relatedPaths: [
      "/dashboard",
      "/blogs/how-to-submit-your-blog-to-directories",
      "/blogs/why-bloghub-is-the-best-blog-directory",
      "/blogs/article-submission-sites",
      "/blogs/blog-promotion-sites",
    ],
    sections: [
      {
        heading: "What makes a directory worth your time",
        paragraphs: [
          "The web is littered with abandoned link farms that do nothing but sell backlinks. A directory is only worth joining if real readers actually use it to discover blogs — otherwise you're shouting into an empty room.",
          "Look for signs of life: recent additions, active categories, community ranking or upvotes, and real readers commenting or engaging. Curation and freshness matter more than sheer size.",
        ],
        bullets: [
          "Readers can browse by category, not just search.",
          "Listings are ranked by genuine engagement, not pay-to-win.",
          "The directory is maintained — new blogs appear regularly.",
          "Being listed is free or fairly priced for what you get.",
        ],
      },
      {
        heading: "A ranked, categorised directory beats a flat list",
        paragraphs: [
          "A plain alphabetical list buries you the moment someone with an A-name joins. A directory organised by category and ranked by reader upvotes gives every blog a fair path upward based on merit.",
          "BlogHub works this way: you pick the category your ideal reader browses, and real upvotes — not ad spend — decide where you sit. Growth compounds from people who actually want to read what you write.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Browse the BlogHub directory",
      },
      {
        heading: "Your listing is a tiny landing page",
        paragraphs: [
          "Getting in is half the job; earning the click is the other half. A clear title, a one-line description that promises a specific payoff, and the right category do most of the work.",
          "Treat the description like a headline test. Name exactly who the blog is for and what they'll get, and skip adjectives any blog could claim.",
        ],
      },
    ],
    faq: [
      {
        question: "Are blog directories still worth it in 2026?",
        answer:
          "The good ones are. Directories that readers actually browse — categorised and community-ranked — send motivated traffic and help discovery. Abandoned link farms are not worth your time and can even look spammy.",
      },
      {
        question: "How many directories should I submit my blog to?",
        answer:
          "Quality over quantity. A handful of active, relevant directories will outperform dozens of dead ones. Prioritise those where your target reader would actually go looking for something to read.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "The best blog directories to get discovered",
        angle: "Commercial-intent pillar for writers ready to submit.",
      },
      {
        channel: "medium",
        title: "How to pick a blog directory that actually sends traffic",
        angle: "Cross-post on evaluating directories.",
      },
      videoAsset("Best blog directories, explained", "Short video on spotting a directory worth joining."),
    ],
  },
  {
    slug: "how-to-submit-your-blog-to-directories",
    title: "How to Submit Your Blog to Directories (Step by Step)",
    description:
      "A step-by-step guide to submitting your blog to directories the right way — choosing categories, writing the listing, and avoiding spammy sites.",
    category: "Distribution",
    publishedAt: "2026-06-29",
    readTime: "6 min read",
    heroEyebrow: "Directories",
    heroTitle: "How to submit your blog to directories",
    heroDescription:
      "Submitting to a directory takes minutes, but a few small choices decide whether it sends you readers or gathers dust. Here's the process that works.",
    primaryKeyword: "how to submit your blog to directories",
    keywordVariant: "mass link submission",
    relatedPaths: [
      "/dashboard",
      "/blogs/best-blog-directories",
      "/blogs/article-submission-sites",
      "/blogs/why-bloghub-is-the-best-blog-directory",
      "/blogs/blog-promotion-sites",
    ],
    sections: [
      {
        heading: "Choose the right directory and category first",
        paragraphs: [
          "Before you fill in a single field, pick a directory readers actually browse and the category your ideal reader would open. The best listing in the wrong category still won't find its audience.",
          "Match the category to the reader, not to how you think of your own work. Where would the person you're writing for go looking?",
        ],
        bullets: [
          "Confirm the directory has active, recent listings.",
          "Pick the single category your reader would browse.",
          "Have your title, description, and cover image ready.",
        ],
      },
      {
        heading: "Write the listing like a promise",
        paragraphs: [
          "Your title and description are the whole pitch. Lead with the specific benefit and name the reader. 'A weekly newsletter on indie game design' beats 'thoughts on games and life' every time.",
          "Keep the description to one tight line that a browsing reader can absorb at a glance, and make the cover image legible at thumbnail size.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Submit your blog to BlogHub",
      },
      {
        heading: "Then help your listing climb",
        paragraphs: [
          "On a community-ranked directory, submission is the start. Early upvotes from your existing readers give a new listing the initial lift it needs to be seen by strangers.",
          "Share your listing with your current audience and ask them to upvote — a small nudge that compounds into real discovery.",
        ],
      },
    ],
    faq: [
      {
        question: "Will submitting my blog to directories hurt my SEO?",
        answer:
          "Not if you stick to reputable, curated directories. Avoid mass-submission services and link farms — those can look spammy. A handful of quality, relevant listings is safe and helpful.",
      },
      {
        question: "What do I need before submitting my blog?",
        answer:
          "A clear title, a one-line description that names your reader and their payoff, the right category, and a clean cover image. Prepare these once and you can submit anywhere in minutes.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to submit your blog to directories",
        angle: "How-to companion to the best-directories pillar.",
      },
      {
        channel: "medium",
        title: "The right way to submit your blog to a directory",
        angle: "Cross-post walkthrough.",
      },
      videoAsset("Submit your blog to a directory in 5 steps", "Screen-style walkthrough video."),
    ],
  },
  {
    slug: "blog-promotion-sites",
    title: "Blog Promotion Sites: Where to Share and Get Read",
    description:
      "A practical rundown of blog promotion sites — directories, communities, and aggregators — plus how to use each one without getting flagged as spam.",
    category: "Distribution",
    publishedAt: "2026-07-01",
    readTime: "7 min read",
    heroEyebrow: "Promotion",
    heroTitle: "Blog promotion sites that actually send readers",
    heroDescription:
      "Not every place you can drop a link is worth your time. Here's how the main types of blog promotion sites differ, and how to use each without wearing out your welcome.",
    primaryKeyword: "blog promotion sites",
    keywordVariant: "link-dropping everywhere",
    relatedPaths: ["/dashboard", "/blogs/best-blog-directories", "/blogs/where-to-share-your-blog-posts"],
    sections: [
      {
        heading: "Three kinds of promotion sites",
        paragraphs: [
          "Blog promotion sites fall into three buckets: directories you list your whole blog in, communities where you share individual posts, and aggregators that resurface content by topic. Each rewards a different approach.",
          "Directories reward a strong evergreen listing. Communities reward genuine participation, not drive-by links. Aggregators reward posts with a clear, specific hook.",
        ],
        bullets: [
          "Directories — list your blog once, get found repeatedly.",
          "Communities — contribute first, share sparingly and on-topic.",
          "Aggregators — lead with a specific, curiosity-driving angle.",
        ],
      },
      {
        heading: "The rule that keeps you welcome",
        paragraphs: [
          "The fastest way to get ignored — or banned — is to treat every site as a billboard. Communities in particular can smell a link-dropper instantly, and the backlash costs more than the post was worth.",
          "Give before you take. Answer questions, upvote others, and share your own work only when it genuinely helps. On a directory, that participation is built in: your listing earns its rank from real readers.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "List your blog the right way",
      },
      {
        heading: "Repurpose so one post fits many sites",
        paragraphs: [
          "The same post can become a directory listing, a community discussion starter, and a short video for a video-first platform. Reshaping it to fit each site beats pasting the identical link everywhere.",
          "A 60-second clip, in particular, travels to places a bare blog link never could.",
        ],
      },
    ],
    faq: [
      {
        question: "Which blog promotion sites are best for a new blog?",
        answer:
          "Start with one good directory and one active community in your niche. They send motivated readers and, unlike broad social posting, put you in front of people already interested in your topic.",
      },
      {
        question: "How do I promote my blog without looking spammy?",
        answer:
          "Participate genuinely and share selectively. On communities, contribute more than you promote. On directories, let a strong listing and real reader engagement do the work rather than blasting links.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Blog promotion sites that actually send readers",
        angle: "Roundup capturing commercial-intent searchers.",
      },
      {
        channel: "substack",
        title: "Where I actually share my posts",
        angle: "Personal take on the sites worth the effort.",
      },
      videoAsset("Blog promotion sites: 3 types explained", "Short explainer on directories vs communities vs aggregators."),
    ],
  },
  {
    slug: "where-to-share-your-blog-posts",
    title: "Where to Share Your Blog Posts for Maximum Reach",
    description:
      "The best places to share each blog post — directories, communities, newsletters, and video — matched to the type of content you're publishing.",
    category: "Distribution",
    publishedAt: "2026-07-03",
    readTime: "6 min read",
    heroEyebrow: "Distribution",
    heroTitle: "Where to share your blog posts",
    heroDescription:
      "Every post has a best home beyond your own site. Matching the post to the channel is the difference between crickets and a steady trickle of new readers.",
    primaryKeyword: "where to share your blog posts",
    keywordVariant: "posting the link once and hoping",
    relatedPaths: ["/dashboard", "/blogs/blog-promotion-sites", "/blogs/repurpose-blog-posts-into-social-media"],
    sections: [
      {
        heading: "Match the post to the channel",
        paragraphs: [
          "A how-to guide belongs somewhere people search for solutions; a personal essay belongs somewhere people browse for a good read. Sharing every post the same way wastes the ones that would thrive elsewhere.",
          "Think about the mindset of the reader on each channel and send each post where that mindset fits.",
        ],
        bullets: [
          "Evergreen guides — directories and search.",
          "Opinion and essays — communities and newsletters.",
          "Visual or step-based posts — short video platforms.",
        ],
      },
      {
        heading: "Start with the channels you own or can join today",
        paragraphs: [
          "Your email list and a category directory are the two places you can reliably reach readers without an algorithm's permission. Send new posts there first, every time.",
          "From that base, expand into communities and video where the specific post fits. Owned and listable channels are the foundation; everything else is upside.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Share your blog on BlogHub",
      },
      {
        heading: "Reshape, don't just repost",
        paragraphs: [
          "Sharing well means adapting the post to each place — a quote for a community, a clip for video, a teaser for your newsletter. The identical link pasted everywhere underperforms the same idea reshaped for its audience.",
          "One post, several tailored front doors, is the whole game.",
        ],
      },
    ],
    faq: [
      {
        question: "Where should I share a blog post first?",
        answer:
          "With the audience you already own — your email list — and in a relevant directory. Those reach motivated readers immediately, without depending on an algorithm to surface you.",
      },
      {
        question: "Should I share the same post on every platform?",
        answer:
          "Share the idea everywhere, but reshape it for each place: a quote or clip for social and video, a teaser for your newsletter, a full listing in a directory. Tailored beats copy-pasted.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Where to share your blog posts",
        angle: "Distribution pillar linking the channel-specific posts.",
      },
      {
        channel: "medium",
        title: "The right home for every kind of blog post",
        angle: "Cross-post on matching content to channel.",
      },
      videoAsset("Where to share every blog post", "Quick guide video mapping post types to channels."),
    ],
  },
  // ── Repurposing & blog-to-video ──────────────────────────────────────────
  {
    slug: "how-to-repurpose-blog-content",
    title: "How to Repurpose Blog Content Into 5 New Formats",
    description:
      "A repeatable system for repurposing blog content into videos, social posts, newsletters, and more — so every post reaches five times the audience.",
    category: "Strategy",
    publishedAt: "2026-07-05",
    readTime: "7 min read",
    heroEyebrow: "Repurposing",
    heroTitle: "How to repurpose blog content",
    heroDescription:
      "Repurposing isn't making more content — it's getting more distribution from content you already made. Here's a system to turn one post into five.",
    primaryKeyword: "how to repurpose blog content",
    keywordVariant: "always making new content",
    relatedPaths: ["/dashboard", "/blogs/content-repurposing-strategy", "/blogs/how-to-turn-a-blog-post-into-a-video"],
    sections: [
      {
        heading: "Start with your best-performing posts",
        paragraphs: [
          "Don't repurpose everything — repurpose what already worked. A post that earned traffic or replies has proven demand, so reshaping it into new formats compounds a known winner instead of gambling on a new idea.",
          "Check your analytics for the handful of posts that outperformed, and make those your repurposing raw material.",
        ],
        bullets: [
          "A short video summarising the key point.",
          "Three to five social snippets pulled from the best lines.",
          "A newsletter segment linking back to the full post.",
          "A quote graphic or carousel of the main takeaways.",
        ],
      },
      {
        heading: "Extract the atoms, then reshape them",
        paragraphs: [
          "Every post contains reusable atoms: a strong stat, a memorable line, a step-by-step list, a contrarian claim. Repurposing is pulling those atoms out and rebuilding them in a format that suits a new channel.",
          "You're not rewriting from scratch — you're recombining pieces you already wrote into shapes that travel further.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get your blog seen on BlogHub",
      },
      {
        heading: "Make video the anchor format",
        paragraphs: [
          "Of all the formats, video reaches the audience furthest from your written blog — people who'll never open an article but will watch a 60-second clip. That makes it the highest-leverage repurpose.",
          "Modern tools like blog2video.app turn a post into a short video in minutes, so the format that once took an afternoon now fits into your normal publishing flow.",
        ],
      },
    ],
    faq: [
      {
        question: "How many formats should I repurpose each post into?",
        answer:
          "Start with two or three you can sustain — typically a short video and a couple of social snippets. It's better to consistently repurpose into a few formats than to attempt everything once and burn out.",
      },
      {
        question: "Isn't repurposing just repeating myself?",
        answer:
          "No. Each channel reaches a mostly different audience, and most people need to encounter an idea more than once. Repurposing spreads a good idea further, not louder to the same ears.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to repurpose blog content",
        angle: "Repurposing pillar linking to the video and social posts.",
      },
      {
        channel: "substack",
        title: "One post, five formats: my repurposing system",
        angle: "Behind-the-scenes essay for subscribers.",
      },
      videoAsset("Repurpose one blog post into 5 pieces", "Meta example: this very post as a clip."),
    ],
  },
  {
    slug: "how-to-turn-a-blog-post-into-a-video",
    title: "How to Turn a Blog Post Into a Video (Fast)",
    description:
      "A simple workflow for turning a blog post into a short video — scripting from your own writing, choosing visuals, and reaching a whole new audience.",
    category: "Video",
    publishedAt: "2026-07-07",
    readTime: "6 min read",
    heroEyebrow: "Blog to Video",
    heroTitle: "How to turn a blog post into a video",
    heroDescription:
      "Your best posts already contain a script. Turning one into a short video is mostly editing, not creating — and it opens a channel most text blogs never touch.",
    primaryKeyword: "how to turn a blog post into a video",
    keywordVariant: "starting a video from scratch",
    relatedPaths: ["/dashboard", "/blogs/how-to-repurpose-blog-content", "/blogs/repurpose-blog-posts-into-social-media"],
    sections: [
      {
        heading: "Your post is already the script",
        paragraphs: [
          "The hardest part of making a video is usually deciding what to say. When you're adapting a blog post, that work is done — you're distilling existing writing, not inventing from a blank page.",
          "Pull the single clearest idea from the post and the three points that support it. That's your script skeleton; everything else is trimming.",
        ],
        bullets: [
          "Open with the one-line promise from your post's intro.",
          "Cover three supporting points, one per beat.",
          "Close with a call to read the full post for the depth.",
        ],
      },
      {
        heading: "Keep it short and visual",
        paragraphs: [
          "A repurposed post works best as a 30-to-90-second clip that delivers one clear takeaway. Trying to cram the whole article in loses the viewer; teasing the best part earns the click back to your writing.",
          "Pair each spoken point with simple visuals — text on screen, a relevant image, a quick example — so the idea lands even on mute.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Grow your blog with BlogHub",
      },
      {
        heading: "Route viewers back to the blog",
        paragraphs: [
          "A video's job in your system is not to replace the post — it's to reach people who'd never find it and send the interested ones back. Always point to the full article for those who want more.",
          "Done consistently — especially with a tool like blog2video.app that scripts and builds the clip straight from your post — blog-to-video turns each post into two front doors: one for readers, one for viewers.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need to be on camera to turn a blog post into a video?",
        answer:
          "No. Text-on-screen clips with voiceover or captions, simple visuals, and a clear takeaway perform well and require no on-camera presence. The point is to deliver the idea, not to become a personality.",
      },
      {
        question: "How long should a blog-to-video clip be?",
        answer:
          "Usually 30 to 90 seconds. Long enough to deliver one clear takeaway, short enough to hold attention and leave viewers wanting the full post. Save the depth for the article you link to.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to turn a blog post into a video",
        angle: "Core blog-to-video how-to — the product's signature angle.",
      },
      {
        channel: "medium",
        title: "Your blog post is already a video script",
        angle: "Cross-post reframing writing as ready-made scripts.",
      },
      videoAsset("Blog post to video in minutes", "Demonstrate the workflow on a real post."),
    ],
  },
  {
    slug: "content-repurposing-strategy",
    title: "A Content Repurposing Strategy That Compounds",
    description:
      "Build a content repurposing strategy that turns every blog post into a system of assets across search, social, video, and email — without doubling your workload.",
    category: "Strategy",
    publishedAt: "2026-07-09",
    readTime: "7 min read",
    heroEyebrow: "Strategy",
    heroTitle: "A content repurposing strategy that compounds",
    heroDescription:
      "A repurposing strategy isn't a list of tasks — it's a system where each post feeds several channels and every channel feeds back to the blog. Here's how to build one.",
    primaryKeyword: "content repurposing strategy",
    keywordVariant: "one-off content creation",
    relatedPaths: ["/dashboard", "/blogs/how-to-repurpose-blog-content", "/blogs/how-to-turn-a-blog-post-into-a-video"],
    sections: [
      {
        heading: "Make the blog post the hub",
        paragraphs: [
          "The most durable strategy treats the blog post as the hub and every other format as a spoke. The post holds the full idea; social snippets, videos, and newsletter segments each carry a piece of it outward and link back.",
          "This keeps your best thinking in one canonical place that earns search traffic, while the spokes handle reach on channels the article can't touch.",
        ],
        bullets: [
          "Hub: the full blog post, optimised for search.",
          "Spokes: video, social, newsletter, community.",
          "Every spoke links back to the hub.",
        ],
      },
      {
        heading: "Systematise it so it's not extra work",
        paragraphs: [
          "A strategy only compounds if it's repeatable. Decide the two or three spokes you'll create for every post, and make them a fixed part of publishing rather than a someday-maybe.",
          "When repurposing is a checklist, not a decision, it happens every time — and the compounding kicks in.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Put your blog in front of readers",
      },
      {
        heading: "Measure which spokes feed the hub",
        paragraphs: [
          "Not every channel will pay off equally. Track which spokes actually send readers and subscribers back to the blog, then double down on those and drop the rest.",
          "The goal is a tight loop where distribution feeds discovery feeds subscribers — a system that grows the blog while you focus on writing.",
        ],
      },
    ],
    faq: [
      {
        question: "What's the difference between repurposing and a repurposing strategy?",
        answer:
          "Repurposing is a one-off act; a strategy is a repeatable system. A strategy fixes which formats you create for every post and how they link back, so distribution compounds instead of happening at random.",
      },
      {
        question: "How do I stop repurposing from doubling my workload?",
        answer:
          "Standardise it. Pick two or three formats, template them, and build them into your publishing routine. Reshaping existing atoms into a fixed set of spokes is far faster than creating fresh content each time.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "A content repurposing strategy that compounds",
        angle: "Strategy pillar for the repurposing cluster.",
      },
      {
        channel: "substack",
        title: "The hub-and-spoke way to repurpose",
        angle: "Framework essay for subscribers.",
      },
      videoAsset("Hub-and-spoke repurposing in 60s", "Diagram-driven explainer video."),
    ],
  },
  {
    slug: "repurpose-blog-posts-into-social-media",
    title: "How to Repurpose Blog Posts Into Social Media Content",
    description:
      "Turn each blog post into a week of social media content — threads, quote graphics, and short videos — with a simple extraction workflow.",
    category: "Distribution",
    publishedAt: "2026-07-11",
    readTime: "6 min read",
    heroEyebrow: "Social",
    heroTitle: "Repurpose blog posts into social media content",
    heroDescription:
      "One solid blog post holds a week of social content. The skill is extracting the right pieces and reshaping them for how people scroll.",
    primaryKeyword: "how to repurpose blog posts into social media",
    keywordVariant: "posting links to your blog",
    relatedPaths: ["/dashboard", "/blogs/how-to-repurpose-blog-content", "/blogs/where-to-share-your-blog-posts"],
    sections: [
      {
        heading: "Mine the post for social-ready pieces",
        paragraphs: [
          "A good post is full of things that stand alone: a surprising stat, a strong opinion, a numbered list, a before-and-after. Each of these is a social post waiting to be lifted out.",
          "Read your post with a highlighter mindset. Every line that could make someone stop scrolling is a candidate.",
        ],
        bullets: [
          "Turn a list section into a carousel or thread.",
          "Turn the boldest claim into a standalone hook.",
          "Turn a key stat into a quote graphic.",
          "Turn the intro into a short talking-head or text clip.",
        ],
      },
      {
        heading: "Reshape for the scroll, don't paste the link",
        paragraphs: [
          "A bare link asks the reader to leave the platform before they know why — most won't. A snippet that delivers value in-feed earns trust first, and the click second.",
          "Give the value away up front, then point to the full post for readers who want the whole thing.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Send social readers to your blog",
      },
      {
        heading: "Let short video do the heavy lifting",
        paragraphs: [
          "Short video is where the most reach lives right now, and a blog post is an easy source for it. One clip per post can out-reach every other social format combined.",
          "Same idea, spoken and captioned in under a minute, with a nudge back to the article.",
        ],
      },
    ],
    faq: [
      {
        question: "How many social posts can I get from one blog post?",
        answer:
          "A substantial post can yield five to ten: a thread, a couple of quote graphics, a stat post, and one or two short videos. The limit is how many distinct atoms the post contains, not your capacity to write more.",
      },
      {
        question: "Should social posts link straight to the blog?",
        answer:
          "Deliver value in the post itself first, then link. Leading with a bare link underperforms because readers won't leave the feed for an unknown payoff. Earn the click by giving something useful up front.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Repurpose blog posts into social media content",
        angle: "Tactical post in the repurposing cluster.",
      },
      {
        channel: "medium",
        title: "Turn one blog post into a week of social content",
        angle: "Cross-post with the extraction workflow.",
      },
      videoAsset("1 blog post = a week of social", "Show the extraction workflow as a clip."),
    ],
  },
  // ── SEO & craft ──────────────────────────────────────────────────────────
  {
    slug: "how-to-write-a-blog-post-that-ranks",
    title: "How to Write a Blog Post That Ranks on Google",
    description:
      "A practical framework for writing blog posts that rank — matching search intent, structuring for readability, and earning discovery beyond search alone.",
    category: "SEO",
    publishedAt: "2026-07-12",
    readTime: "8 min read",
    heroEyebrow: "SEO",
    heroTitle: "How to write a blog post that ranks",
    heroDescription:
      "Ranking isn't about tricking Google — it's about answering a specific question better than the current results, then making the post easy to find while search catches up.",
    primaryKeyword: "how to write a blog post that ranks",
    keywordVariant: "keyword stuffing",
    relatedPaths: ["/dashboard", "/blogs/blog-seo-for-beginners", "/blogs/how-to-structure-a-blog-post"],
    sections: [
      {
        heading: "Match the intent behind the search",
        paragraphs: [
          "Every keyword hides an intent — the searcher wants to learn, compare, or buy. A post that ranks gives them exactly the type of answer they expected. Write a how-to for a how-to query, a comparison for a comparison query.",
          "Look at what already ranks for your target term. The format Google rewards is visible in the current top results; match it, then do it better.",
        ],
        bullets: [
          "Choose one clear target keyword per post.",
          "Confirm the intent from the current top results.",
          "Answer the question completely, not partially.",
        ],
      },
      {
        heading: "Structure for skimmers and search engines",
        paragraphs: [
          "Clear headings, short paragraphs, and a logical flow help readers and crawlers alike. A post that's easy to skim keeps readers on the page longer, which is exactly the signal search engines reward.",
          "Put your target phrase in the title, the first paragraph, and one heading — naturally, not stuffed. Then let the writing be genuinely useful.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get your posts discovered faster",
      },
      {
        heading: "Don't wait on search alone",
        paragraphs: [
          "Ranking takes months, so the smartest writers seed distribution while they wait. Directory listings, community shares, and repurposed clips send early readers and signals that help the post rank sooner.",
          "Search is the long game; discovery channels are how you stay motivated — and get read — in the meantime.",
        ],
      },
    ],
    faq: [
      {
        question: "How long until a blog post ranks on Google?",
        answer:
          "Typically three to six months for a newer site, as the page ages and earns links and engagement. Targeting lower-competition, specific keywords shortens that, and off-search distribution gets you readers immediately.",
      },
      {
        question: "How many keywords should one blog post target?",
        answer:
          "One primary keyword, plus the closely related phrasings that naturally appear when you answer the question fully. Trying to target many unrelated terms in one post dilutes it and helps it rank for none.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to write a blog post that ranks",
        angle: "SEO pillar linking to the craft and SEO-basics posts.",
      },
      {
        channel: "medium",
        title: "Write posts that rank by matching intent",
        angle: "Cross-post on search intent.",
      },
      videoAsset("Write a blog post that ranks", "Short video on intent-matching."),
    ],
  },
  {
    slug: "blog-seo-for-beginners",
    title: "Blog SEO for Beginners: The Only Basics You Need",
    description:
      "A no-jargon guide to blog SEO for beginners — keywords, on-page basics, internal links, and the fast channels to use while SEO ramps up.",
    category: "SEO",
    publishedAt: "2026-07-14",
    readTime: "7 min read",
    heroEyebrow: "SEO",
    heroTitle: "Blog SEO for beginners",
    heroDescription:
      "SEO sounds technical, but the fundamentals for a blog fit on a napkin. Get these right and you're ahead of most blogs in your niche.",
    primaryKeyword: "blog seo for beginners",
    keywordVariant: "advanced technical SEO",
    relatedPaths: ["/dashboard", "/blogs/how-to-write-a-blog-post-that-ranks", "/blogs/how-to-come-up-with-blog-post-ideas"],
    sections: [
      {
        heading: "The three basics that matter most",
        paragraphs: [
          "For a blog, SEO comes down to three things: target real search queries, answer them well, and connect your posts with internal links. Everything else is a refinement of those.",
          "Skip the technical rabbit holes until you have traffic worth optimising. A beginner's time is best spent on content and structure, not schema debates.",
        ],
        bullets: [
          "Write posts around questions people actually search.",
          "Put the keyword in your title, intro, and one heading.",
          "Link related posts together so they reinforce each other.",
        ],
      },
      {
        heading: "Internal links are your secret weapon",
        paragraphs: [
          "Internal links are the easiest SEO win a beginner has and the most neglected. They pass authority between your posts, help search engines understand your topics, and keep readers moving through your site.",
          "Every time you publish, link to two or three older posts, and update an older post to link to the new one. Over time this builds a web that lifts everything.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Boost discovery beyond search",
      },
      {
        heading: "SEO is slow — pair it with fast channels",
        paragraphs: [
          "Even done perfectly, SEO takes months. Beginners who rely on it alone often quit before it pays off. Pair it with directories, communities, and repurposing so you get readers now and rankings later.",
          "Think of SEO as the compounding base and the fast channels as the fuel that keeps you going until it compounds.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need to be technical to do blog SEO?",
        answer:
          "No. The highest-impact basics — targeting real queries, answering them well, and internal linking — require no coding. Technical SEO matters more for large sites; for a blog, content and structure come first.",
      },
      {
        question: "What's the fastest SEO win for a new blog?",
        answer:
          "Internal linking. It's free, immediate, and neglected by most beginners. Connecting related posts helps search engines understand your site and keeps readers exploring, both of which help you rank.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Blog SEO for beginners",
        angle: "Beginner SEO pillar with wide top-of-funnel appeal.",
      },
      {
        channel: "medium",
        title: "Blog SEO basics without the jargon",
        angle: "Cross-post for beginners.",
      },
      videoAsset("Blog SEO basics in 90 seconds", "Beginner-friendly explainer video."),
    ],
  },
  {
    slug: "how-to-come-up-with-blog-post-ideas",
    title: "How to Come Up With Blog Post Ideas That People Search",
    description:
      "Never run out of blog post ideas — mine questions, keywords, and your own audience for topics people are actually looking for.",
    category: "Craft",
    publishedAt: "2026-07-15",
    readTime: "6 min read",
    heroEyebrow: "Ideas",
    heroTitle: "How to come up with blog post ideas",
    heroDescription:
      "Great blog ideas aren't invented at a desk — they're collected from the questions your readers already ask and the searches they already make.",
    primaryKeyword: "how to come up with blog post ideas",
    keywordVariant: "waiting for inspiration",
    relatedPaths: ["/dashboard", "/blogs/blog-seo-for-beginners", "/blogs/how-to-write-a-catchy-blog-title"],
    sections: [
      {
        heading: "Mine questions, not your imagination",
        paragraphs: [
          "The best posts answer questions people are already asking. Those questions are everywhere — in search suggestions, community threads, the replies to your own posts, and the emails your readers send you.",
          "Keep a running list of every real question you encounter. That list is a content calendar that writes itself, and every item comes with built-in demand.",
        ],
        bullets: [
          "Check search autocomplete and related searches.",
          "Read the questions in niche communities.",
          "Note what readers ask you directly.",
          "Turn one broad topic into several specific questions.",
        ],
      },
      {
        heading: "Validate demand before you write",
        paragraphs: [
          "An idea you love isn't the same as an idea people search for. A quick check in a keyword tool tells you whether a topic has an audience, so you spend your writing time on posts that can actually get found.",
          "Prioritise specific, lower-competition questions — they're easier to rank for and often reveal exactly what to say.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Find readers for your ideas",
      },
      {
        heading: "One idea, many angles",
        paragraphs: [
          "A single topic contains a dozen posts if you vary the angle — a beginner's guide, a comparison, a mistakes list, a case study. This is how prolific bloggers stay prolific without straining for novelty.",
          "Each angle also repurposes cleanly into its own set of clips and snippets.",
        ],
      },
    ],
    faq: [
      {
        question: "How do I find blog post ideas people actually search for?",
        answer:
          "Start with search autocomplete, related searches, and community questions in your niche, then validate the promising ones in a keyword tool. This grounds your ideas in real demand instead of guesswork.",
      },
      {
        question: "What should I do when I run out of ideas?",
        answer:
          "Return to questions. Re-read reader emails and community threads, and take one topic you've covered and attack it from a new angle — a comparison, a mistakes list, a beginner version. Angles multiply ideas.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to come up with blog post ideas",
        angle: "Top-of-funnel craft post for new bloggers.",
      },
      {
        channel: "substack",
        title: "My system for never running out of ideas",
        angle: "Personal workflow essay.",
      },
      videoAsset("Never run out of blog ideas", "Quick idea-mining video."),
    ],
  },
  {
    slug: "how-to-write-a-catchy-blog-title",
    title: "How to Write a Catchy Blog Title (That Isn't Clickbait)",
    description:
      "A formula for catchy blog titles that earn clicks honestly — clear benefit, specificity, and the searchable phrase, without resorting to clickbait.",
    category: "Craft",
    publishedAt: "2026-07-16",
    readTime: "6 min read",
    heroEyebrow: "Headlines",
    heroTitle: "How to write a catchy blog title",
    heroDescription:
      "The title decides whether your work gets read at all. A catchy title isn't a trick — it's a clear, specific promise the post actually keeps.",
    primaryKeyword: "how to write a catchy blog title",
    keywordVariant: "clickbait headlines",
    relatedPaths: ["/dashboard", "/blogs/how-to-get-more-blog-readers", "/blogs/how-to-come-up-with-blog-post-ideas"],
    sections: [
      {
        heading: "Clarity beats cleverness",
        paragraphs: [
          "The most common title mistake is being clever at the expense of clear. A pun the reader has to decode loses to a plain title that instantly says what they'll get.",
          "Before anything else, make sure a stranger can tell from the title alone what the post is about and why it's for them.",
        ],
        bullets: [
          "Name the concrete benefit or outcome.",
          "Add a specific number, timeframe, or detail.",
          "Include the phrase your reader would search.",
        ],
      },
      {
        heading: "Specificity is what makes it catchy",
        paragraphs: [
          "Specific titles feel more credible and more interesting than broad ones. 'How I got my first 1,000 readers in 90 days' beats 'How to grow your blog' because the detail signals a real, ownable story.",
          "Numbers, timeframes, and named constraints all add the specificity that makes a title stop the scroll honestly.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Put your best titles in front of readers",
      },
      {
        heading: "Match the promise to the payoff",
        paragraphs: [
          "Catchy without delivery is clickbait, and it costs you trust the moment the reader feels tricked. The best titles set an expectation the post immediately meets.",
          "Write the title as a promise, then make sure the opening lines pay it off — that's what turns a click into a returning reader.",
        ],
      },
    ],
    faq: [
      {
        question: "What makes a blog title catchy without being clickbait?",
        answer:
          "A clear, specific promise the post keeps. Catchy comes from concreteness — a number, a timeframe, a named outcome — not from exaggeration. Clickbait over-promises and under-delivers; a good title does the opposite.",
      },
      {
        question: "Should my blog title include the keyword?",
        answer:
          "Yes, ideally near the front. Including the phrase people search helps the post get found and reassures readers they're in the right place. Just keep it natural rather than forcing an awkward exact match.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to write a catchy blog title",
        angle: "Craft post that also improves every other post's reach.",
      },
      {
        channel: "medium",
        title: "The catchy-but-honest title formula",
        angle: "Cross-post with the formula.",
      },
      videoAsset("Write catchy titles, not clickbait", "Before-and-after title examples on video."),
    ],
  },
  {
    slug: "how-long-should-a-blog-post-be",
    title: "How Long Should a Blog Post Be? A Straight Answer",
    description:
      "How long a blog post should be depends on intent, not a magic word count. Here's how to size each post — and why depth beats padding.",
    category: "Craft",
    publishedAt: "2026-07-17",
    readTime: "5 min read",
    heroEyebrow: "Craft",
    heroTitle: "How long should a blog post be?",
    heroDescription:
      "There's no universal word count. The right length is however long it takes to answer the question completely — and not one padded word longer.",
    primaryKeyword: "how long should a blog post be",
    keywordVariant: "hitting a word count",
    relatedPaths: ["/dashboard", "/blogs/how-to-structure-a-blog-post", "/blogs/how-to-write-a-blog-post-that-ranks"],
    sections: [
      {
        heading: "Length follows intent",
        paragraphs: [
          "A quick-answer query wants a concise post; a how-to or comparison wants depth. The right length is set by what the reader came to accomplish, not by an arbitrary target.",
          "Check what already ranks for your topic. If the top results are thorough guides, a thin post won't compete; if they're quick answers, padding yours will only hurt.",
        ],
        bullets: [
          "Quick facts: a few hundred words is plenty.",
          "How-to and guides: as long as completeness requires.",
          "Opinion and essays: as long as the argument earns.",
        ],
      },
      {
        heading: "Depth wins, padding loses",
        paragraphs: [
          "Longer posts often rank better, but not because of length itself — because thorough posts tend to cover the topic completely. Padding to hit a number does the opposite: it dilutes the useful parts and pushes readers away.",
          "Aim for complete, then cut anything that doesn't earn its place. Complete-and-tight beats long-and-loose every time.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get your posts in front of readers",
      },
      {
        heading: "Long posts repurpose better anyway",
        paragraphs: [
          "A thorough post is a bigger quarry for repurposing — more atoms to pull into clips, threads, and snippets. That's a practical reason to favour depth where the topic warrants it.",
          "Write the complete version once, then mine it for a month of distribution.",
        ],
      },
    ],
    faq: [
      {
        question: "Is there an ideal blog post length for SEO?",
        answer:
          "No single number. Thorough posts often rank well because they cover a topic completely, but that's depth, not word count. Match the length to search intent and the depth of the current top-ranking results.",
      },
      {
        question: "Are short blog posts bad for SEO?",
        answer:
          "Not at all, when the query wants a short answer. Forcing length onto a simple topic hurts more than it helps. Short-and-complete beats long-and-padded whenever the reader just needs a quick, clear answer.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How long should a blog post be?",
        angle: "High-intent craft FAQ that ranks easily.",
      },
      {
        channel: "medium",
        title: "The honest answer to blog post length",
        angle: "Cross-post myth-busting word-count rules.",
      },
      videoAsset("How long should a blog post be?", "Myth-busting short video."),
    ],
  },
  {
    slug: "how-to-structure-a-blog-post",
    title: "How to Structure a Blog Post Readers Finish",
    description:
      "A reliable structure for blog posts — hook, promise, scannable body, and a clear next step — that keeps readers reading and helps posts rank.",
    category: "Craft",
    publishedAt: "2026-07-18",
    readTime: "6 min read",
    heroEyebrow: "Craft",
    heroTitle: "How to structure a blog post",
    heroDescription:
      "Structure is what separates a post people finish from one they abandon. A simple, repeatable skeleton makes every post easier to write and easier to read.",
    primaryKeyword: "how to structure a blog post",
    keywordVariant: "writing without an outline",
    relatedPaths: ["/dashboard", "/blogs/how-long-should-a-blog-post-be", "/blogs/how-to-write-a-blog-post-that-ranks"],
    sections: [
      {
        heading: "Hook, promise, payoff",
        paragraphs: [
          "The opening has one job: convince the reader to keep going. Lead with a hook that names their problem, make a clear promise about what the post delivers, and then deliver it without detours.",
          "Readers decide in the first few lines whether to stay. Earn that decision before you get into the detail.",
        ],
        bullets: [
          "Open with the reader's problem or question.",
          "Promise the specific payoff early.",
          "Use headings so the structure is visible at a glance.",
          "End with one clear next step.",
        ],
      },
      {
        heading: "Make the body scannable",
        paragraphs: [
          "Most readers skim before they read. Descriptive headings, short paragraphs, and the occasional list let a skimmer grasp the shape of your argument and decide where to slow down.",
          "Scannable structure isn't dumbing down — it's respecting how people actually read on screens, and it keeps them on the page longer.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get your well-structured posts read",
      },
      {
        heading: "Always end with a next step",
        paragraphs: [
          "A post that ends flat wastes the attention it earned. Close with one clear action — subscribe, read a related post, try the thing you described — so the reader's momentum goes somewhere.",
          "One next step, chosen deliberately, converts far better than a scattered list of options.",
        ],
      },
    ],
    faq: [
      {
        question: "What's the simplest structure for a blog post?",
        answer:
          "Hook, promise, scannable body with clear headings, and one next step. This skeleton works for almost any post, makes writing faster, and keeps readers oriented from the first line to the last.",
      },
      {
        question: "How do I keep readers from leaving halfway through?",
        answer:
          "Deliver on your promise early and keep the body scannable with headings and short paragraphs. Readers leave when they can't tell where a post is going or when it stops paying off — structure fixes both.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to structure a blog post",
        angle: "Craft pillar linking the writing-focused posts.",
      },
      {
        channel: "medium",
        title: "The hook-promise-payoff structure",
        angle: "Cross-post on the skeleton.",
      },
      videoAsset("Structure a blog post readers finish", "Short video on the skeleton."),
    ],
  },
  // ── Getting started & foundations ────────────────────────────────────────
  {
    slug: "how-to-start-a-blog-for-beginners",
    title: "How to Start a Blog for Beginners in 2026",
    description:
      "A beginner's guide to starting a blog — choosing a niche and platform, publishing your first posts, and getting discovered from day one.",
    category: "Growth",
    publishedAt: "2026-07-19",
    readTime: "8 min read",
    heroEyebrow: "Getting Started",
    heroTitle: "How to start a blog for beginners",
    heroDescription:
      "Starting a blog is the easy part — most people get stuck on what comes after. This guide covers both: launching cleanly and getting read from the start.",
    primaryKeyword: "how to start a blog for beginners",
    keywordVariant: "overthinking the setup",
    relatedPaths: ["/dashboard", "/blogs/best-blogging-platforms", "/blogs/how-to-get-your-first-1000-blog-readers"],
    sections: [
      {
        heading: "Pick a niche and a platform, then start",
        paragraphs: [
          "Beginners lose months choosing the perfect platform and niche. The truth is you can change both later — what you can't get back is the time spent not publishing. Pick a specific-enough topic and a simple platform, and start.",
          "A narrow niche makes you findable and recommendable. A simple platform gets you writing instead of tinkering. Both decisions should take days, not months.",
        ],
        bullets: [
          "Choose a niche narrow enough to describe in one sentence.",
          "Pick a platform you can publish on today.",
          "Set a cadence you can sustain for a year.",
        ],
      },
      {
        heading: "Publish before you polish",
        paragraphs: [
          "Your first posts won't be your best, and that's fine — they're how you find your voice. Waiting until everything is perfect is just a comfortable way to avoid starting.",
          "Publish a handful of posts, learn what resonates, and improve in public. Momentum teaches faster than planning.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Get your new blog discovered",
      },
      {
        heading: "Plan for discovery from day one",
        paragraphs: [
          "The biggest beginner mistake is publishing into the void with no distribution plan. From your very first post, get listed in a directory, share where your readers gather, and start collecting emails.",
          "Discovery isn't something you bolt on later once you're 'ready' — it's part of publishing from post one.",
        ],
      },
    ],
    faq: [
      {
        question: "How do I start a blog with no experience?",
        answer:
          "Pick a narrow niche, choose a simple platform, and publish a few short posts to find your voice. Don't over-invest in setup — the skills come from writing and getting feedback, not from perfect tooling.",
      },
      {
        question: "What should I do right after publishing my first post?",
        answer:
          "Distribute it. List your blog in a relevant directory, share the post where your intended readers gather, and add a way for visitors to subscribe. Discovery starts with your first post, not your fiftieth.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to start a blog for beginners",
        angle: "Broad beginner pillar feeding the whole cluster.",
      },
      {
        channel: "medium",
        title: "Start a blog the right way in 2026",
        angle: "Cross-post for aspiring bloggers.",
      },
      videoAsset("Start a blog: the beginner path", "Step-by-step starter video."),
    ],
  },
  {
    slug: "best-blogging-platforms",
    title: "The Best Blogging Platforms Compared (2026)",
    description:
      "A clear-eyed comparison of the best blogging platforms — from WordPress to newsletter tools — matched to what you're actually trying to build.",
    category: "Strategy",
    publishedAt: "2026-07-20",
    readTime: "8 min read",
    heroEyebrow: "Tools",
    heroTitle: "The best blogging platforms compared",
    heroDescription:
      "The best platform isn't the most popular one — it's the one that fits your goals, your skills, and how you want to reach readers. Here's how to choose.",
    primaryKeyword: "best blogging platforms",
    keywordVariant: "picking the trendiest tool",
    relatedPaths: ["/dashboard", "/blogs/how-to-start-a-blog-for-beginners", "/blogs/build-email-list-from-your-blog"],
    sections: [
      {
        heading: "Choose by goal, not by hype",
        paragraphs: [
          "Every platform is 'best' in some review because reviews rarely ask what you're trying to do. A self-hosted site, a hosted builder, and a newsletter tool each win for different goals — control, simplicity, or audience-building.",
          "Decide first whether you're optimising for ownership, ease, or email growth. The right platform falls out of that answer.",
        ],
        bullets: [
          "Maximum control and SEO — a self-hosted site.",
          "Simplicity and speed — a hosted website builder.",
          "Audience and email first — a newsletter platform.",
        ],
      },
      {
        heading: "Don't let the platform lock in your reach",
        paragraphs: [
          "Whatever you choose, your readership shouldn't live only inside one platform's walls. An email list and a presence in directories mean you can switch tools later without losing your audience.",
          "Own the connection to your readers even when you rent the software. Platforms come and go; a list and a discoverable presence follow you.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Stay discoverable on any platform",
      },
      {
        heading: "Whatever you pick, plan to repurpose",
        paragraphs: [
          "No platform distributes for you. Regardless of where you write, the growth comes from getting listed, sharing, and repurposing posts into other formats like short video.",
          "The tool is the easy decision; the distribution habit is the one that actually grows the blog.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the best blogging platform for beginners?",
        answer:
          "A simple hosted builder or newsletter tool that gets you publishing quickly, so you spend time writing rather than configuring. You can migrate to something more powerful later once you know what you need.",
      },
      {
        question: "Does the blogging platform I choose affect SEO?",
        answer:
          "Somewhat — self-hosted sites give you the most control over SEO, while some hosted tools limit it. But content quality and distribution matter far more than platform choice for a typical blog's rankings.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "The best blogging platforms compared",
        angle: "Commercial-intent comparison pillar.",
      },
      {
        channel: "medium",
        title: "How to actually choose a blogging platform",
        angle: "Cross-post on choosing by goal.",
      },
      videoAsset("Best blogging platforms, compared fast", "Short comparison video."),
    ],
  },
  {
    slug: "build-email-list-from-your-blog",
    title: "How to Build an Email List From Your Blog",
    description:
      "Turn blog readers into an email list you own — where to place sign-up prompts, what to offer, and how to keep subscribers engaged.",
    category: "Email",
    publishedAt: "2026-07-21",
    readTime: "7 min read",
    heroEyebrow: "Email",
    heroTitle: "How to build an email list from your blog",
    heroDescription:
      "Search rankings and social reach are rented; an email list is owned. Building one from your blog is the single best insurance policy for your audience.",
    primaryKeyword: "how to build an email list from your blog",
    keywordVariant: "relying on social followers",
    relatedPaths: ["/dashboard", "/blogs/how-to-grow-your-blog-audience", "/blogs/how-to-get-your-first-1000-blog-readers"],
    sections: [
      {
        heading: "Ask clearly, and give a reason",
        paragraphs: [
          "Most blogs fail to build a list because the ask is vague or buried. 'Subscribe for updates' asks the reader to do work for an unclear reward. Name exactly what they'll get and when.",
          "A specific promise — a weekly tip, a free guide, the next post in a series — converts far better than a generic newsletter signup.",
        ],
        bullets: [
          "Place a sign-up prompt where attention peaks in the post.",
          "Offer a specific, concrete reason to subscribe.",
          "Keep the form short — email is usually enough.",
        ],
      },
      {
        heading: "Capture readers you worked hard to earn",
        paragraphs: [
          "Every channel you use — search, directories, social, video — spends effort getting a reader to your post. Without a sign-up, that effort evaporates the moment they leave. The list is how you make each hard-won visit count twice.",
          "Treat the subscribe as the goal of the visit, not an afterthought at the bottom of the page.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Send more readers to your blog",
      },
      {
        heading: "Keep the list warm",
        paragraphs: [
          "A list you never email goes cold and stops opening. Show up on a predictable cadence with something genuinely useful, and your subscribers become your most reliable source of traffic for every new post.",
          "Repurpose each new post into a short email so staying in touch costs you almost nothing.",
        ],
      },
    ],
    faq: [
      {
        question: "Why is an email list better than social followers?",
        answer:
          "You own the connection. Social reach depends on an algorithm that can change overnight, while email reaches subscribers directly whenever you choose. A list is the one audience asset a platform can't take away.",
      },
      {
        question: "When should I start building an email list?",
        answer:
          "From your very first post. Even a handful of early subscribers compounds, and adding a sign-up later means all your early traffic left without a way to come back. Start capturing readers immediately.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to build an email list from your blog",
        angle: "Retention pillar linking growth and platform posts.",
      },
      {
        channel: "substack",
        title: "Why your list beats your follower count",
        angle: "Essay on owned vs rented audience.",
      },
      videoAsset("Build an email list from your blog", "Short video on the subscribe placement."),
    ],
  },
  {
    slug: "how-to-get-your-first-1000-blog-readers",
    title: "How to Get Your First 1,000 Blog Readers",
    description:
      "A concrete plan for reaching your first 1,000 blog readers — the milestone where momentum starts — using discovery channels, not luck.",
    category: "Growth",
    publishedAt: "2026-07-21",
    readTime: "7 min read",
    heroEyebrow: "Milestones",
    heroTitle: "How to get your first 1,000 blog readers",
    heroDescription:
      "The first thousand readers are the hardest and the most important. Hit that milestone and word of mouth, search, and community start doing some of the work for you.",
    primaryKeyword: "how to get your first 1000 blog readers",
    keywordVariant: "waiting to go viral",
    relatedPaths: ["/dashboard", "/blogs/how-to-grow-your-blog-audience", "/blogs/build-email-list-from-your-blog"],
    sections: [
      {
        heading: "Stack small channels deliberately",
        paragraphs: [
          "You don't reach a thousand readers with one big break — you reach it by stacking small, reliable channels. A directory listing here, a community share there, a repurposed clip elsewhere, and the numbers add up faster than they feel like they will.",
          "Pick three channels you can work consistently and show up on them every time you publish. Consistency, not virality, gets you to the milestone.",
        ],
        bullets: [
          "Get listed where your niche's readers browse.",
          "Contribute genuinely in one or two communities.",
          "Repurpose each post into a short video.",
          "Convert every visit toward an email subscribe.",
        ],
      },
      {
        heading: "Turn early readers into a flywheel",
        paragraphs: [
          "Your first readers are your best growth engine if you let them be. Ask for upvotes on your directory listing, encourage shares, and make subscribing effortless — each early fan brings the next few.",
          "A community-ranked directory turns this into a flywheel: early support lifts your rank, which brings new readers, who support you in turn.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Start your climb on BlogHub",
      },
      {
        heading: "Measure what's working and repeat it",
        paragraphs: [
          "By the time you approach a thousand readers, the data will tell you which channel is pulling its weight. Double down on that one and stop spreading yourself thin across channels that aren't paying off.",
          "The first thousand is a discovery process as much as a growth one — you're learning your fastest path while you walk it.",
        ],
      },
    ],
    faq: [
      {
        question: "How long does it take to get 1,000 blog readers?",
        answer:
          "With consistent distribution across a few channels, many blogs reach it within a few months. Relying on search or luck alone takes much longer. Stacking directories, community, and repurposing is what accelerates it.",
      },
      {
        question: "Why is the first 1,000 readers such a big milestone?",
        answer:
          "It's the point where momentum compounds — enough readers to generate word of mouth, feedback, and social proof. Below it you're pushing alone; above it, search, community, and referrals start pulling for you.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to get your first 1,000 blog readers",
        angle: "Milestone pillar tying the growth cluster together.",
      },
      {
        channel: "substack",
        title: "The first 1,000 readers, channel by channel",
        angle: "Personal playbook essay.",
      },
      videoAsset("Your first 1,000 blog readers", "Motivational how-to video."),
    ],
  },

  // ── Newsletters: Substack / beehiiv / Ghost ──────────────────────────────
  // Second keyword cluster, sized with DataForSEO (US, en). The posts above own
  // the "blog" half of the audience; these own the "newsletter" half — the same
  // writer, different vocabulary. Volumes are noted on each primaryKeyword.
  {
    slug: "how-to-promote-your-newsletter",
    title: "How to Promote Your Newsletter: 11 Channels That Work Without a Budget",
    description:
      "A channel-by-channel guide to promoting your newsletter for free — directories, cross-promotion, communities, search, and repurposing — whether you publish on Substack, beehiiv, or Ghost.",
    category: "Newsletters",
    publishedAt: "2026-08-07",
    readTime: "9 min read",
    heroEyebrow: "Newsletter Growth",
    heroTitle: "How to promote your newsletter",
    heroDescription:
      "Writing the newsletter is the part you control. Getting it in front of people is the part most writers never plan for. Here are the eleven channels that reliably add subscribers without an ad budget.",
    primaryKeyword: "how to promote your newsletter",
    keywordVariant: "buying subscribers",
    relatedPaths: [
      "/submit-your-newsletter",
      "/blogs/best-newsletter-directories",
      "/blogs/how-to-grow-on-substack",
    ],
    sections: [
      {
        heading: "Start with the channels that don't need an audience",
        paragraphs: [
          "Most newsletter growth advice quietly assumes you already have a following — post to your audience, tell your readers to share, ask your subscribers to forward. If you're on issue three with forty subscribers, none of that does anything. You need channels that work when nobody knows who you are.",
          "There are three of them: directories, where readers browse by category and find publications they've never heard of; communities, where you earn attention by being useful before you ever link to yourself; and search, where someone types a question and your answer is the one they land on. All three send strangers. None of them require you to already have subscribers.",
        ],
        bullets: [
          "List your newsletter in directories that readers actually browse.",
          "Answer real questions in one or two communities where your readers gather.",
          "Publish your archive on the open web so search engines can index it.",
          "Put a subscribe form on every page a stranger might land on.",
        ],
      },
      {
        heading: "Then add cross-promotion, the fastest channel of all",
        paragraphs: [
          "Once you have a few hundred subscribers, cross-promotion becomes the highest-return thing you can do. A recommendation from a newsletter in your niche converts far better than any social post, because the reader already trusts the person making it and has already proven they'll subscribe to an email newsletter.",
          "Substack's recommendations feature and beehiiv's boosts both formalise this, but the manual version works everywhere and works better: find five newsletters roughly your size writing for roughly your reader, and offer a straight swap. The pitch is short — here's my newsletter, here's my subscriber count, want to trade a mention? Half will ignore you. The ones who don't are worth more than a month of posting to social media.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "List your newsletter on BlogHub — free",
      },
      {
        heading: "Make one issue reach four audiences",
        paragraphs: [
          "The most common waste in newsletter publishing is writing something good, sending it once, and letting it die in an inbox. The archive is the asset. Every issue you've already written can be a blog post that ranks, a thread that circulates, and a short video on a platform where written newsletters have no presence at all.",
          "This isn't extra content — it's extra distribution for content that already exists. A newsletter with an indexed public archive picks up search traffic for years; the same newsletter sent only to subscribers picks up none. Turn on your web archive, let it get crawled, and treat each issue as something that keeps working after send day.",
        ],
      },
    ],
    faq: [
      {
        question: "How do I promote a newsletter with zero subscribers?",
        answer:
          "Use the channels that don't depend on an existing audience: submit to newsletter directories, answer questions genuinely in communities where your readers already are, and make your archive public so search engines can index it. Cross-promotion is the fastest channel, but it only starts working once you have a few hundred subscribers to trade with.",
      },
      {
        question: "Should I pay for newsletter subscribers?",
        answer:
          "Paid acquisition works, but it's the wrong first move. Paid subscribers churn faster and open less than readers who chose you, and until you know your retention numbers you'll be buying subscribers who cost more than they're worth. Exhaust the free channels first — they also tell you which positioning actually resonates before you spend money amplifying it.",
      },
      {
        question: "How long does it take to grow a newsletter?",
        answer:
          "Directory and cross-promotion subscribers show up within days. Search traffic takes three to six months to build as your archive ages and earns links. That gap is exactly why you stack fast channels on top of the slow one rather than waiting for search alone to deliver.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to promote your newsletter",
        angle: "Pillar post the rest of the newsletter cluster links back to.",
      },
      {
        channel: "substack",
        title: "The eleven channels I'd work for a brand-new newsletter",
        angle: "First-person version for an audience of writers.",
      },
      videoAsset(
        "Promote your newsletter: 11 free channels",
        "Rapid-fire channel rundown with a directory-submission demo.",
      ),
    ],
  },
  {
    slug: "best-newsletter-directories",
    title: "The Best Newsletter Directories to Submit Your Publication To",
    description:
      "A working list of newsletter directories worth submitting to — what each one is, who it's right for, and how to get listed. Plus how directory listings actually convert into subscribers.",
    category: "Distribution",
    publishedAt: "2026-08-07",
    readTime: "8 min read",
    heroEyebrow: "Discovery",
    heroTitle: "The best newsletter directories",
    heroDescription:
      "Directories are the one growth channel that works identically on day one and at ten thousand subscribers. Here's which ones are worth your time, and what separates a listing that sends readers from one that just sits there.",
    primaryKeyword: "newsletter directories",
    keywordVariant: "submitting everywhere at once",
    relatedPaths: [
      "/submit-your-newsletter",
      "/blogs/why-bloghub-is-the-best-blog-directory",
      "/blogs/article-submission-sites",
      "/blogs/how-to-promote-your-newsletter",
      "/blogs/best-blog-directories",
    ],
    sections: [
      {
        heading: "What a directory listing is actually worth",
        paragraphs: [
          "A directory listing does two separate jobs, and writers usually only count the first one. The obvious job is discovery: a reader browses a category, sees your description, and subscribes. The less obvious job is that your listing is a permanent, indexable page pointing at your publication — which matters enormously when you're a new site with no backlinks and nothing telling search engines you exist.",
          "The second job is why directories are worth submitting to even when the immediate click-through is modest. A social post is gone in a day. A directory page gets crawled, stays up, and keeps sending the occasional reader for as long as it's live. For a publication with no link profile, those first few directory links are often the only ones you can get without asking anyone for a favour.",
        ],
      },
      {
        heading: "Directories vs aggregators — know which one you're submitting to",
        paragraphs: [
          "These get used interchangeably and they are not the same thing. A directory lists publications so readers can find you and subscribe on your own platform — you get the subscriber, the email address, and the relationship. An aggregator pulls the actual issues into its own inbox or feed, and readers consume your writing there.",
          "Aggregators can be worth it for reach, but understand the trade: you're renting an audience rather than building one, and you generally don't get the email address. If you only have time to submit to a handful of places, prioritise the directories that send readers to your subscribe page over the aggregators that keep the reading on their own site.",
        ],
        bullets: [
          "Directories — readers subscribe on your platform. You own the relationship.",
          "Aggregators — readers read on theirs. Reach without the email address.",
          "Curated newsletters — an editor features you once. High spike, no permanence.",
          "Marketplaces — built for ad buying, not organic discovery.",
        ],
      },
      {
        heading: "How to submit so the listing actually converts",
        paragraphs: [
          "Most directory listings underperform for a boring reason: the description is about the newsletter instead of about the reader. \"A weekly newsletter about design\" tells a browser nothing. \"Every Tuesday, one design teardown you can steal for your own product\" tells them exactly what they get and how often. In a category page of forty listings, the description is the entire pitch.",
          "Be specific about the niche, name the cadence, and lead with the benefit rather than the topic. Then keep the listing current — an outdated description or a dead link is worse than no listing, because it burns the one impression you get from a reader who was already interested.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "Submit your newsletter to BlogHub",
      },
      {
        heading: "Submit steadily, not all at once",
        paragraphs: [
          "There's a temptation to find a list of eighty directories and spend a Saturday submitting to all of them. Resist it. Most of that list will be abandoned sites with no readers, and a link from a dead directory does nothing for you.",
          "Pick the ones with visible activity — recent listings, real categories, a reason a reader would visit — and do those properly, with a description you actually wrote for each. Five good listings outperform fifty copy-pasted ones, and it takes less of your afternoon.",
        ],
      },
    ],
    faq: [
      {
        question: "Are newsletter directories worth submitting to?",
        answer:
          "Yes, for two reasons: readers browsing a directory have already decided they want to subscribe to something new, which makes them a warmer audience than a social feed; and each listing is a permanent indexable page linking to your publication. For a new newsletter with no backlinks, directory links are often the only ones available without asking someone for a favour.",
      },
      {
        question: "How many newsletter directories should I submit to?",
        answer:
          "Five to ten active ones, done properly, beats fifty done carelessly. Prioritise directories with visible recent activity and real category browsing over abandoned link farms — a listing on a directory nobody visits does nothing for discovery and very little for search.",
      },
      {
        question: "Is it free to list a newsletter in a directory?",
        answer:
          "The good ones are. Some directories charge for expedited review or featured placement, but paying for a basic listing is rarely worth it — if a directory can't attract readers without charging publishers, it probably isn't sending you many.",
      },
      {
        question: "What should I write in my directory listing description?",
        answer:
          "Name the reader, the cadence, and the benefit — in that order. \"Every Tuesday, one design teardown you can steal for your own product\" beats \"a weekly newsletter about design\" because a browser scanning forty listings needs to know what they get, not what your topic is.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "The best newsletter directories",
        angle: "Reference post that earns links from other growth articles.",
      },
      {
        channel: "medium",
        title: "Where to submit your newsletter in 2026",
        angle: "Listicle framing for Medium's discovery algorithm.",
      },
      videoAsset(
        "Newsletter directories worth your time",
        "Screen-recorded walkthrough of submitting a listing end to end.",
      ),
    ],
  },
  {
    slug: "substack-vs-beehiiv",
    title: "Substack vs beehiiv: Which Should You Publish On?",
    description:
      "An honest comparison of Substack and beehiiv — pricing, built-in discovery, growth tooling, monetisation, and portability — to help you pick the right platform for the newsletter you're actually writing.",
    category: "Platforms",
    publishedAt: "2026-08-06",
    readTime: "10 min read",
    heroEyebrow: "Platform Comparison",
    heroTitle: "Substack vs beehiiv",
    heroDescription:
      "Both will send your email reliably. The real difference is what each one does about the hard part — getting people to subscribe in the first place — and what it costs you when it works.",
    primaryKeyword: "substack vs beehiiv",
    keywordVariant: "picking on vibes",
    relatedPaths: [
      "/blogs/best-newsletter-platforms",
      "/blogs/how-to-grow-on-substack",
      "/submit-your-newsletter",
    ],
    sections: [
      {
        heading: "The pricing models point in opposite directions",
        paragraphs: [
          "Substack is free to use and takes 10% of your paid subscription revenue. There's no monthly bill, no subscriber-count tier, and no cost at all if you never charge readers. beehiiv inverts this: you pay a monthly fee that scales with list size, and it takes no cut of your subscription revenue.",
          "That difference decides more than it looks like it does. If you're not monetising, Substack costs nothing and beehiiv costs money — Substack wins on pure economics. If you're earning meaningfully from paid subscriptions, 10% of revenue forever eventually dwarfs a monthly platform fee, and beehiiv wins. The crossover point is lower than most writers expect, which is why so many established paid newsletters have migrated.",
        ],
        bullets: [
          "Not monetising yet — Substack is free, beehiiv is not.",
          "Earning from paid subscriptions — beehiiv's flat fee beats a 10% revenue share.",
          "Monetising through ads and sponsorships — beehiiv's ad network is built for it.",
          "Unsure — start where it's free, and know that migration is possible.",
        ],
      },
      {
        heading: "Discovery is Substack's real product",
        paragraphs: [
          "Substack's genuine advantage isn't the editor — it's the network. Recommendations, Notes, and the app put your publication in front of readers who are already reading something adjacent, and for a newsletter starting from zero that's a meaningful source of subscribers you'd otherwise have to go find yourself.",
          "beehiiv's answer is more mechanical and, in its way, more honest: boosts let you pay other publishers per subscriber, and the recommendation network is something you configure rather than something the platform does to you. Substack's discovery feels like free growth; it's really the thing you're paying that 10% for. beehiiv's is a growth channel you buy explicitly. Neither is wrong — but know which one you're choosing.",
        ],
      },
      {
        heading: "Growth tooling and analytics",
        paragraphs: [
          "beehiiv is unambiguously the more serious growth tool. Segmentation, A/B tested subject lines, referral programmes, polls, landing-page builders, and an ad network are all built in. If you think of your newsletter as a media business you're operating, that toolkit is the difference between guessing and knowing.",
          "Substack deliberately doesn't have most of that, and for a lot of writers that's the appeal rather than a shortcoming. If you want to write an essay and press send, Substack's near-total lack of knobs is a feature. If you find yourself wanting to test a subject line or segment your list by engagement and the platform simply won't let you, that's the signal you've outgrown it.",
        ],
      },
      {
        heading: "The thing that actually matters: neither one grows you",
        paragraphs: [
          "It's easy to spend a week on this decision and then discover the platform wasn't the bottleneck. Both send email reliably. Both handle payments. Both have a serviceable editor. The publications that grow on either platform are the ones whose writers do the distribution work — showing up in communities, trading recommendations with peers, listing in directories, and building an archive that search engines can index.",
          "Pick on the economics, because that part genuinely differs. Then spend the time you saved on the channels that add subscribers, which look identical regardless of which of the two you chose.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "List your newsletter, whichever platform you're on",
      },
    ],
    faq: [
      {
        question: "Is beehiiv better than Substack?",
        answer:
          "Not universally — they optimise for different writers. beehiiv is better if you're monetising through ads or paid subscriptions, or if you want segmentation, referral programmes, and A/B testing. Substack is better if you're writing essays, aren't monetising yet, or value its built-in reader network over growth tooling.",
      },
      {
        question: "Can I move my newsletter from Substack to beehiiv?",
        answer:
          "Yes. Both let you export your subscriber list as a CSV, and beehiiv has an import flow built specifically for Substack migrations that carries over posts as well as subscribers. What doesn't transfer is your Substack recommendation network and any inbound traffic from the Substack app, which is a real cost worth weighing before you move.",
      },
      {
        question: "Is Substack really free?",
        answer:
          "Free until you charge readers, then 10% of your subscription revenue indefinitely. For a free newsletter it genuinely costs nothing. For a paid newsletter earning a few thousand a month, that 10% is substantially more than beehiiv's monthly fee for the same list size.",
      },
      {
        question: "Which platform is better for growing from zero?",
        answer:
          "Substack, marginally, because its recommendation network and app surface new publications to existing readers without you doing anything. But the effect is smaller than its reputation suggests — most newsletters that grow on Substack grow because their writers work external channels, not because the network delivered.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Substack vs beehiiv",
        angle: "Comparison post targeting the highest-volume term in the cluster.",
      },
      {
        channel: "substack",
        title: "I compared Substack and beehiiv properly. Here's the honest answer.",
        angle: "Opinionated take that works natively on Substack itself.",
      },
      videoAsset(
        "Substack vs beehiiv in 90 seconds",
        "Side-by-side comparison table as a fast explainer.",
      ),
    ],
  },
  {
    slug: "substack-alternatives",
    title: "9 Substack Alternatives Worth Considering (and Who Each Is For)",
    description:
      "The best Substack alternatives compared — beehiiv, Ghost, Kit, Buttondown, and more — with the pricing model, ownership trade-off, and ideal writer for each.",
    category: "Platforms",
    publishedAt: "2026-08-06",
    readTime: "9 min read",
    heroEyebrow: "Platform Comparison",
    heroTitle: "Substack alternatives",
    heroDescription:
      "Most writers looking for a Substack alternative want one of three things: to stop paying 10%, to own their platform outright, or to get growth tooling Substack won't build. Here's who solves which.",
    primaryKeyword: "substack alternatives",
    keywordVariant: "switching without a reason",
    relatedPaths: [
      "/blogs/substack-vs-beehiiv",
      "/blogs/best-newsletter-platforms",
      "/submit-your-newsletter",
    ],
    sections: [
      {
        heading: "First, work out why you're actually leaving",
        paragraphs: [
          "\"Substack alternative\" covers at least three completely different complaints, and the right answer depends entirely on which one is yours. If the issue is the 10% revenue share, you want a flat-fee platform. If it's ownership — the domain, the design, the fact that your publication lives inside someone else's brand — you want something self-hostable. If it's the missing growth tooling, you want a platform built for operators.",
          "Writers who skip this step tend to migrate to whichever platform they saw recommended most recently, discover it solves a problem they didn't have, and lose their recommendation network in the process. Name the complaint before you shop.",
        ],
        bullets: [
          "Paying 10% on real revenue — look at flat-fee platforms.",
          "Want to own the domain, design, and data — look at self-hosted.",
          "Need segmentation, tests, and referrals — look at operator tooling.",
          "Just want simpler and cheaper — look at minimal, developer-friendly tools.",
        ],
      },
      {
        heading: "The flat-fee alternatives",
        paragraphs: [
          "beehiiv is the most direct competitor and the most common destination for newsletters with real paid revenue. You pay monthly by list size and keep 100% of subscription income, plus you get referral programmes, segmentation, A/B testing, and an ad network aimed at sponsorship revenue. It has a purpose-built Substack import that carries over both posts and subscribers.",
          "Kit — formerly ConvertKit — approaches the same problem from the creator-business direction rather than the publishing one. Its automation and tagging are stronger than anything in this category, which matters if your newsletter sells a course or product rather than subscriptions. Buttondown sits at the opposite end: deliberately minimal, genuinely cheap, markdown-first, and ideal if you want an email tool rather than a media platform.",
        ],
      },
      {
        heading: "The ownership alternatives",
        paragraphs: [
          "Ghost is the serious answer for writers who want to own the whole thing. It's open source, runs on your own domain, handles memberships and paid subscriptions natively, and takes no cut — you pay for hosting, either to Ghost Pro or to whatever server you run it on yourself. The archive is a proper website you control, which is a meaningful SEO advantage over a publication living on a subdomain of someone else's platform.",
          "Self-hosting has an honest cost: you're now responsible for deliverability, updates, and the parts Substack quietly did for you. If that trade sounds fine, Ghost is the strongest option in this list. If it sounds like a second job, it isn't.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "List your publication — any platform",
      },
      {
        heading: "What you lose when you leave",
        paragraphs: [
          "Every migration guide covers exporting your subscribers, which is the easy part — every platform here supports a CSV import. What they skip is what doesn't come with you: your Substack recommendation network, inbound traffic from the app, and whatever discovery the platform was quietly doing on your behalf.",
          "For a newsletter earning nothing, that's often most of your growth, and leaving costs more than the 10% you're avoiding. For a newsletter with real revenue and a distribution habit of its own, it's a rounding error. Be honest about which one you are — and if you're leaving a network behind, replace it deliberately with directories, cross-promotion, and search before you move rather than after.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the best Substack alternative?",
        answer:
          "beehiiv for newsletters with paid subscribers or ad revenue, because a flat fee beats a 10% revenue share once you're earning. Ghost if you want to own your platform, domain, and archive outright. Buttondown if you want something minimal and cheap. There's no single best — it depends on whether your complaint is the fee, the ownership, or the missing tooling.",
      },
      {
        question: "Is there a free alternative to Substack?",
        answer:
          "beehiiv and Buttondown both have free tiers with subscriber caps, and Ghost is free if you self-host and only pay for your own server. But nothing else matches Substack's specific deal of costing literally nothing at any list size until you start charging readers.",
      },
      {
        question: "Will I lose subscribers if I move off Substack?",
        answer:
          "Your list transfers intact via CSV, so you don't lose the subscribers themselves. What you lose is the ongoing acquisition — recommendations, Notes, and app discovery stop feeding you new readers the moment you leave. Have a replacement growth channel in place before you migrate, not after.",
      },
      {
        question: "Is Ghost better than Substack for SEO?",
        answer:
          "Generally yes, because Ghost runs on your own domain, so every post builds authority for a site you own rather than for a subdomain of a platform. You also get full control of metadata, structured data, and site structure. It's a real advantage, but it's only worth the migration if you're actually going to publish for search.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Substack alternatives",
        angle: "High-intent commercial post for writers already considering a move.",
      },
      {
        channel: "medium",
        title: "I looked at every Substack alternative. Here's who each is for.",
        angle: "Comparison framing that travels well off-site.",
      },
      videoAsset(
        "Substack alternatives, ranked by why you're leaving",
        "Decision-tree explainer keyed to the three complaints.",
      ),
    ],
  },
  {
    slug: "best-newsletter-platforms",
    title: "The Best Newsletter Platforms in 2026 (Compared by What You're Building)",
    description:
      "A comparison of the best newsletter platforms — Substack, beehiiv, Ghost, Kit, Buttondown, and Mailchimp — by pricing model, growth tooling, ownership, and the kind of publication each actually suits.",
    category: "Platforms",
    publishedAt: "2026-08-05",
    readTime: "10 min read",
    heroEyebrow: "Platform Comparison",
    heroTitle: "The best newsletter platforms",
    heroDescription:
      "Every platform on this list will deliver your email. They differ on who pays, who owns the audience, and how much the tool helps you grow — which is what you should actually be choosing on.",
    primaryKeyword: "best newsletter platforms",
    keywordVariant: "choosing on features you'll never use",
    relatedPaths: [
      "/blogs/substack-vs-beehiiv",
      "/blogs/substack-alternatives",
      "/submit-your-newsletter",
    ],
    sections: [
      {
        heading: "Three questions that decide it",
        paragraphs: [
          "Newsletter platform comparisons usually turn into feature tables nobody can act on. In practice the decision comes down to three questions, and once you've answered them the shortlist is obvious.",
          "First: how will this make money — subscriptions, sponsorships, or as a funnel for something else you sell? Second: do you need to own the domain and archive, or are you fine publishing inside someone else's platform? Third: are you a writer who wants to press send, or an operator who wants to segment, test, and measure? Everything else is detail.",
        ],
        bullets: [
          "Monetising by subscription — the platform's revenue cut is the whole decision.",
          "Monetising by sponsorship — you need an ad network and real analytics.",
          "Selling a product — you need automation and tagging, not publishing tools.",
          "Not monetising — pick whatever is free and start writing.",
        ],
      },
      {
        heading: "The platforms, and who each is genuinely for",
        paragraphs: [
          "Substack is for writers who want zero friction and zero cost until they charge — essayists, columnists, anyone whose product is the writing itself. It's free forever if you never monetise, takes 10% when you do, and its recommendation network is a real if overstated source of early subscribers.",
          "beehiiv is for operators building a media business: flat monthly pricing, no revenue cut, and the deepest growth toolkit in the category — referrals, segmentation, A/B tests, and a built-in ad network. Ghost is for writers who want to own everything: open source, your own domain, no revenue cut, native memberships, and the best SEO position of any option here because the archive is a real site you control.",
          "Kit is for creators whose newsletter supports a product, where automation and tagging matter more than publishing polish. Buttondown is for people who want a plain, cheap, markdown-first email tool with no media-platform ambitions. Mailchimp is for businesses sending marketing email who happen to also send a newsletter — it's a marketing suite first, and it shows.",
        ],
      },
      {
        heading: "The trap: choosing on features you'll never use",
        paragraphs: [
          "It's easy to pick the platform with the longest feature list and feel like you've made the safe choice. But segmentation you never configure and A/B tests you never run are worth exactly nothing, and you'll have paid a monthly fee for them since issue one.",
          "If you're at zero subscribers, the honest answer is that platform choice barely matters and the cheapest option that lets you start today is the right one. The features become worth paying for at the point where you can name the specific thing you want to do and your current tool won't let you. Until then they're a way of feeling productive without publishing.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "Whatever you pick, get it listed",
      },
      {
        heading: "Make sure your archive is a public website",
        paragraphs: [
          "One thing genuinely worth checking before you commit: does the platform publish your issues to a crawlable web archive, and can you point your own domain at it? A newsletter whose archive is indexed picks up search traffic for years after each issue sends. One that only exists in inboxes picks up none.",
          "All the platforms here can do this, but the defaults differ and some make it awkward. Turn it on, put it on a domain you own if you can, and treat every issue as a page that will still be earning readers long after send day.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the best newsletter platform for beginners?",
        answer:
          "Substack, in most cases — it's free until you monetise, there's nothing to configure, and its recommendation network gives new publications a small amount of discovery for free. Buttondown is a good alternative if you'd rather have a plain email tool than a media platform.",
      },
      {
        question: "What is the best newsletter platform for making money?",
        answer:
          "beehiiv if you're monetising through sponsorships or paid subscriptions, because it takes no cut of your revenue and has an ad network built in. Ghost if you want paid memberships with no platform fee at all and are willing to handle hosting. Substack's 10% is the simplest arrangement but the most expensive one at scale.",
      },
      {
        question: "Which newsletter platform is best for SEO?",
        answer:
          "Ghost, because your archive runs on your own domain, so every post builds authority for a site you own and you control the metadata and structure. Any platform that lets you use a custom domain and publishes a crawlable archive will work — what you want to avoid is an archive locked to a subdomain you don't control.",
      },
      {
        question: "Can I switch newsletter platforms later?",
        answer:
          "Yes. Every platform here exports subscribers as a CSV, and most have import flows for the common migrations. What doesn't transfer is any platform-native discovery you were relying on, so build growth channels you own — directories, cross-promotion, search — and switching stays cheap.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "The best newsletter platforms",
        angle: "Top-of-funnel comparison that feeds the rest of the platform cluster.",
      },
      {
        channel: "medium",
        title: "Stop comparing newsletter platforms on features",
        angle: "Contrarian angle on the same research.",
      },
      videoAsset(
        "Pick a newsletter platform in 60 seconds",
        "Three-question decision tree as a short video.",
      ),
    ],
  },
  {
    slug: "how-to-grow-on-substack",
    title: "How to Grow on Substack When You're Starting From Zero",
    description:
      "A practical guide to growing a Substack from no subscribers — recommendations, Notes, cross-promotion, directories, and SEO — without waiting for the algorithm to find you.",
    category: "Newsletters",
    publishedAt: "2026-08-05",
    readTime: "9 min read",
    heroEyebrow: "Newsletter Growth",
    heroTitle: "How to grow on Substack",
    heroDescription:
      "Substack's network will help you — but only once you've given it something to work with. Here's what to do in the months before the recommendation flywheel starts turning.",
    primaryKeyword: "how to grow on substack",
    keywordVariant: "waiting for the algorithm",
    relatedPaths: [
      "/blogs/how-to-get-substack-subscribers",
      "/blogs/how-to-promote-your-newsletter",
      "/submit-your-newsletter",
    ],
    sections: [
      {
        heading: "Understand what Substack's network will and won't do",
        paragraphs: [
          "Substack's discovery is real, and it's also conditional. Recommendations, Notes, and the app surface publications to readers — but overwhelmingly to publications that already have subscribers, engagement, and other writers willing to recommend them. The network amplifies momentum; it does not create it.",
          "This is the single most useful thing to internalise early, because it reframes the first few months. You are not waiting to be discovered. You are assembling the minimum viable evidence — a real niche, a consistent cadence, a few hundred subscribers — that makes the network willing to amplify you. Everything below is about getting to that point faster.",
        ],
      },
      {
        heading: "Recommendations are the highest-return thing you can do",
        paragraphs: [
          "Substack recommendations convert extraordinarily well because they're shown at the moment someone has just subscribed to something — they've already proven they'll hand over an email address, and they trust the writer doing the recommending. Nothing else on the platform converts like it.",
          "Getting them is unglamorous and mostly manual. Find ten Substacks writing for roughly your reader at roughly your size, read them properly, and reach out with a specific note about their work and an offer to recommend each other. Most won't reply. The ones who do compound: each recommendation exposes you to every new subscriber that publication gets, indefinitely.",
        ],
        bullets: [
          "Target publications adjacent to yours, not identical to them.",
          "Read a few issues before you write — generic pitches get ignored.",
          "Offer first. Recommend them, then ask.",
          "Revisit as you grow; larger publications say yes at larger sizes.",
        ],
      },
      {
        heading: "Use Notes as a discovery surface, not a social feed",
        paragraphs: [
          "Notes is where Substack shows your writing to people who don't subscribe to you, which makes it the closest thing the platform has to organic reach. The mistake is treating it like a social network — posting links to your latest issue and hoping. Links out of a feed perform badly on every platform, and Notes is no exception.",
          "What works is posting the substance itself: a self-contained observation, a short excerpt that stands on its own, a genuinely useful answer to something in your niche. Readers who find that valuable go and look at who wrote it. The subscribe happens on your publication page, not from a link in the post.",
        ],
      },
      {
        heading: "Don't leave Substack's borders unworked",
        paragraphs: [
          "The publications that grow fastest on Substack are rarely doing anything clever inside Substack. They're bringing readers in from outside it — from directories where readers browse by category, from communities where the writer is a genuine participant, and from search, because their archive is public and indexed and answers questions people type into Google.",
          "Substack gives you a public archive by default, which is a real asset most writers ignore. Write at least some issues that answer a specific question someone would search for, and those pages will keep delivering subscribers long after the send. Combined with a few directory listings and steady cross-promotion, that's what gets you to the point where the network starts helping.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "Get your Substack listed on BlogHub",
      },
    ],
    faq: [
      {
        question: "How do you grow a Substack with no subscribers?",
        answer:
          "Work the channels that don't require an existing audience: list your publication in newsletter directories, participate genuinely in communities where your readers already are, and write issues that answer specific searchable questions so your public archive picks up search traffic. Then add cross-promotion once you have a few hundred subscribers to trade with.",
      },
      {
        question: "Do Substack recommendations actually work?",
        answer:
          "They're the highest-converting channel on the platform, because they appear right when someone has just subscribed to something else and has already proven they'll subscribe. The hard part isn't the feature, it's getting other writers to recommend you — which is manual outreach, not something the platform arranges.",
      },
      {
        question: "How often should I publish on Substack?",
        answer:
          "Consistently enough that readers remember subscribing. Weekly is the common default and it works, but a genuinely good monthly issue beats a weekly one you resent writing. What kills growth is irregularity — readers who can't predict you unsubscribe, and Substack's network favours publications with steady engagement.",
      },
      {
        question: "Does Substack help with SEO?",
        answer:
          "Somewhat. Your archive is public and indexable, which is more than most email platforms do by default, and Substack's domain has real authority. The limitation is that you're building that authority on a subdomain you don't own — useful while you're there, but it doesn't come with you if you leave.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to grow on Substack",
        angle: "Core growth post for the Substack half of the cluster.",
      },
      {
        channel: "substack",
        title: "What I'd do differently growing a Substack from zero",
        angle: "Native-format essay for the platform it's about.",
      },
      videoAsset(
        "Growing a Substack from zero",
        "Walk through the recommendation outreach process on screen.",
      ),
    ],
  },
  {
    slug: "how-to-get-substack-subscribers",
    title: "How to Get Substack Subscribers: 8 Tactics That Actually Convert",
    description:
      "Eight concrete tactics for getting more Substack subscribers — from recommendation swaps and welcome-page fixes to directory listings and searchable archive posts.",
    category: "Newsletters",
    publishedAt: "2026-08-04",
    readTime: "8 min read",
    heroEyebrow: "Newsletter Growth",
    heroTitle: "How to get Substack subscribers",
    heroDescription:
      "Traffic isn't usually the problem — conversion is. Here are the eight changes that move the number, roughly in order of how much they return for the effort.",
    primaryKeyword: "how to get substack subscribers",
    keywordVariant: "buying a subscriber list",
    relatedPaths: [
      "/blogs/how-to-grow-on-substack",
      "/blogs/substack-vs-beehiiv",
      "/submit-your-newsletter",
    ],
    sections: [
      {
        heading: "Fix the page people actually land on",
        paragraphs: [
          "Before you chase more traffic, look at what a stranger sees when they arrive. Most Substack homepages open with the publication name, a vague one-liner, and the latest post — which asks a first-time visitor to work out for themselves whether this is for them.",
          "Your description should name the reader, the cadence, and the payoff in one sentence: who this is for, how often it arrives, what they get. Then make sure the top post is your best one rather than your most recent one — pin something that demonstrates the value rather than something that assumes it. This costs twenty minutes and lifts the conversion rate on every visitor you've already earned.",
        ],
        bullets: [
          "One-line description: who it's for, how often, what they get.",
          "Pin your strongest post, not your newest.",
          "Cut the sign-up friction — no explanation of what a newsletter is.",
          "Make the About page answer \"why you\", briefly.",
        ],
      },
      {
        heading: "Trade recommendations deliberately",
        paragraphs: [
          "Recommendations are the highest-converting subscriber source on Substack, and they're distributed almost entirely by manual outreach. Every publication that recommends you shows your name to every new subscriber they get, permanently — it compounds in a way that no single post ever does.",
          "Build a list of fifteen publications adjacent to your niche at a similar size, read them, and write short specific notes offering to recommend each other. Expect most not to reply. The handful that do will outperform months of posting. Then repeat the exercise every time you double in size, because publications that said no at two hundred subscribers say yes at two thousand.",
        ],
      },
      {
        heading: "Write for searches, not just for subscribers",
        paragraphs: [
          "Your Substack archive is public and indexed, which means some fraction of your issues can be doing subscriber acquisition permanently rather than for the twenty-four hours after send. The catch is that most newsletter issues answer no searchable question — they're timely, personal, and reference-free.",
          "Once every few issues, deliberately write something evergreen that answers a question someone types into Google in your niche. Put the question in the title, answer it completely, and let it accumulate. These posts do nothing on send day and quietly become your most reliable source of new subscribers over the following year.",
        ],
      },
      {
        heading: "Be findable outside Substack",
        paragraphs: [
          "The last several tactics are about existing where readers are already looking for something new to subscribe to. Newsletter directories are the obvious one — readers browsing them have already decided they want a new subscription, which makes them the warmest audience you'll find anywhere. List your publication, write the description for the reader rather than about yourself, and keep it current.",
          "Beyond that: answer questions properly in the two or three communities where your readers congregate, put your subscribe link somewhere permanent in every profile you own, and turn issues into short video where written newsletters have essentially no competition. None of these are clever. All of them work, and almost nobody does them consistently.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "List your Substack where readers browse",
      },
    ],
    faq: [
      {
        question: "How do I get my first 100 Substack subscribers?",
        answer:
          "Personal outreach for the first twenty or so — genuinely ask people who'd find it useful. Then list in newsletter directories, participate in two communities where your readers already are, and fix your publication page so the visitors you do get actually convert. The first hundred come from effort, not from distribution mechanics.",
      },
      {
        question: "Why is my Substack not getting subscribers?",
        answer:
          "Usually one of two things: nobody is landing on your page, or people land and don't convert. Check your visitor numbers first. If traffic is near zero it's a distribution problem — directories, cross-promotion, search. If traffic is fine but subscriptions aren't, it's your description and pinned post failing to explain who the publication is for.",
      },
      {
        question: "Should I make my Substack paid to get more subscribers?",
        answer:
          "No — paywalling reduces subscribers by definition. Paid conversion is a separate problem you solve after you have a free audience big enough to convert a small percentage of. Growing the free list is the prerequisite, not the alternative.",
      },
      {
        question: "How many Substack subscribers is good?",
        answer:
          "It depends entirely on the niche and what you want from it. A few hundred genuinely engaged readers in a narrow professional niche is worth more than ten thousand passive ones. Track open rate and replies rather than the raw number — those tell you whether the list is real.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to get Substack subscribers",
        angle: "Tactical companion to the broader Substack growth post.",
      },
      {
        channel: "substack",
        title: "Eight things that actually moved my subscriber count",
        angle: "First-person tactic list.",
      },
      videoAsset(
        "8 ways to get more Substack subscribers",
        "Fast tactical list with on-screen examples of good publication pages.",
      ),
    ],
  },
  {
    slug: "how-to-start-a-newsletter",
    title: "How to Start a Newsletter: A Practical Guide From Idea to First 100 Readers",
    description:
      "How to start a newsletter that people actually read — picking a niche, choosing a platform, setting a cadence you can keep, and getting your first hundred subscribers.",
    category: "Newsletters",
    publishedAt: "2026-08-04",
    readTime: "9 min read",
    heroEyebrow: "Getting Started",
    heroTitle: "How to start a newsletter",
    heroDescription:
      "The technical part takes an afternoon. The parts that decide whether it works — the niche, the cadence, and the first hundred readers — are what this guide is about.",
    primaryKeyword: "how to start a newsletter",
    keywordVariant: "starting with the platform",
    relatedPaths: [
      "/blogs/best-newsletter-platforms",
      "/blogs/how-to-promote-your-newsletter",
      "/submit-your-newsletter",
    ],
    sections: [
      {
        heading: "Pick a niche narrow enough to be obvious",
        paragraphs: [
          "The most common reason a newsletter fails is that nobody can tell who it's for. \"A newsletter about technology\" competes with everything and belongs to nobody. \"A weekly teardown of one B2B onboarding flow\" is instantly legible — a reader knows in three seconds whether it's for them, and the ones who say yes are the ones who stay.",
          "Narrow feels like it limits your audience. It doesn't; it makes you findable. You can broaden later once people know what you are, and every established newsletter you admire started far more specific than it is now.",
        ],
        bullets: [
          "Name the reader, not the topic.",
          "Promise a specific recurring thing, not general coverage.",
          "Pick something you can still write about in six months.",
          "If you can't describe it in one sentence, it's too broad.",
        ],
      },
      {
        heading: "Choose a platform in ten minutes, not ten days",
        paragraphs: [
          "Platform choice absorbs an enormous amount of time that would be better spent writing. At zero subscribers the honest answer is that it barely matters: Substack is free until you monetise and requires no configuration, which makes it the sensible default for most people starting out.",
          "The two things genuinely worth checking are whether you can point your own domain at it later, and whether it publishes a public, crawlable archive. Both keep future options open. Everything else — segmentation, A/B testing, referral programmes — is worth paying for at the point where you can name what you'd do with it, which is not today.",
        ],
      },
      {
        heading: "Set a cadence you can hold on a bad week",
        paragraphs: [
          "Pick the frequency you could sustain during your busiest month, then commit to it publicly. Weekly is the default and works well, but a good monthly issue beats a weekly one you come to resent — and irregularity is what actually loses readers, because people who can't predict you stop expecting you.",
          "Write three issues before you launch. It gives you a buffer for the first bad week, and more usefully it tells you whether the idea has legs before you've announced it to anyone. A surprising number of newsletter ideas die at issue two, and it's much better to find that out privately.",
        ],
      },
      {
        heading: "Get the first hundred readers deliberately",
        paragraphs: [
          "Nobody arrives by accident at the start. The first twenty subscribers come from asking people directly — not a broadcast announcement, but individual messages to people who'd genuinely find it useful. It feels awkward and it's the highest-converting outreach you will ever do.",
          "After that, use the channels that work without an audience: submit to newsletter directories where readers browse by category, participate properly in the one or two communities where your readers already gather, and make sure your archive is public so search can start working in the background. A hundred readers is not a vanity milestone — it's the point at which cross-promotion becomes available to you, and that's what unlocks everything after.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "List your new newsletter on BlogHub",
      },
    ],
    faq: [
      {
        question: "How do I start a newsletter for free?",
        answer:
          "Substack and Buttondown both let you publish and send at no cost, and beehiiv has a free tier with a subscriber cap. Substack stays free at any list size until you start charging readers, which makes it the simplest starting point if you're not monetising yet.",
      },
      {
        question: "How many subscribers do I need before launching?",
        answer:
          "None. Launch at zero and grow in public — waiting for an audience before you start is the most common way a newsletter never happens. What's worth having before you launch is three written issues, so you have a buffer and proof to yourself that the idea sustains.",
      },
      {
        question: "How often should I send a newsletter?",
        answer:
          "Whatever you can hold during your busiest month. Weekly is the common default, but consistency matters far more than frequency — a reliable monthly issue builds a better list than an erratic weekly one, because readers who can't predict you stop opening.",
      },
      {
        question: "What should my first newsletter issue be about?",
        answer:
          "Make it the clearest demonstration of the recurring thing you're promising. Don't spend issue one introducing yourself — new subscribers care whether the format is worth their inbox, so show them the format working. Save the introduction for a permanent About page.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "How to start a newsletter",
        angle: "Top-of-funnel entry point into the whole newsletter cluster.",
      },
      {
        channel: "substack",
        title: "What I'd tell someone starting a newsletter tomorrow",
        angle: "Advice-essay version for a writer audience.",
      },
      videoAsset(
        "Start a newsletter: idea to first 100 readers",
        "End-to-end getting-started explainer.",
      ),
    ],
  },

  // ── Video ────────────────────────────────────────────────────────────────
  {
    slug: "ai-video-generators-that-arent-slop",
    title: "AI Video Generators That Aren't Slop: A Writer's Filter",
    description:
      "Video is the fastest way to reach readers who'll never find your writing — and the fastest way to embarrass yourself if the tool makes slop. Two questions that sort the category.",
    category: "Video",
    publishedAt: "2026-08-19",
    readTime: "7 min read",
    heroEyebrow: "AI Video",
    heroTitle: "AI video generators that aren't slop",
    heroDescription:
      "Your name goes on the video, which makes this a reputation decision rather than a tooling one. Two questions sort the tools worth using from the ones that will cost you readers.",
    primaryKeyword: "ai slop",
    keywordVariant: "generic AI video",
    relatedPaths: [
      "/blogs/how-to-turn-a-blog-post-into-a-video",
      "/blogs/how-to-repurpose-blog-content",
      "/blogs/repurpose-blog-posts-into-social-media",
      "/dashboard",
    ],
    sections: [
      {
        heading: "The stakes are different for a publisher",
        paragraphs: [
          "For most people, a bad AI video is a wasted afternoon. For someone who publishes under their own name, it's worse than that: readers who meet you through a hollow, generic clip form a view of your writing before they ever read a sentence of it. The video is the audition.",
          "That's the real reason to be picky here. Not snobbery about AI — repurposing is one of the highest-leverage things a small publication can do — but the fact that the first impression is the one you're spending.",
        ],
      },
      {
        heading: "Slop is a production method, not a look",
        paragraphs: [
          "It helps to be precise about what people are objecting to. Slop isn't a visual style you can fix with a better model or a higher resolution. It's the result of a video being generated about a topic rather than built from a source.",
          "Ask a prompt-driven tool for a video about your essay and it returns pixels that have never touched your essay. It doesn't know your argument, your example, or the specific number you spent an afternoon verifying. So it produces something adjacent and plausible. Readers rarely think 'a machine made this' — they think 'this doesn't know anything', which is the more damaging conclusion.",
        ],
      },
      {
        heading: "Question one: does it start from my writing?",
        paragraphs: [
          "A tool that takes a URL, a post, or a document as its input has something to be faithful to. A tool that takes a prompt does not. Everything downstream follows from that difference.",
          "In practice this shows up as specificity. Does your headline appear on screen as your headline? Does the figure you cited show up as that figure? Can a viewer who reads the post afterwards recognise it as the same piece? If a sample video could be swapped between two unrelated articles without anyone noticing, the tool isn't reading anything.",
          "This is also where the term programmatic video comes in, and it's less technical than it sounds. It means the video is assembled by code: layouts are components with defined slots, and the content pulled from your post is the data that fills them. Same post in, same video out, every time — which is why nothing on screen arrives by chance, and why fixing a typo re-renders one word rather than producing a different video.",
        ],
        bullets: [
          "The source is a URL, post, or file — not a prompt.",
          "Your headings, quotes, and numbers survive into the video intact.",
          "You can edit a single scene instead of regenerating everything.",
          "Two videos from your publication look like they came from one publication.",
        ],
      },
      {
        heading: "Question two: did a human design what it looks like?",
        paragraphs: [
          "Faithfulness gets you accuracy, not watchability. A video can be entirely correct and still unwatchable, so taste has to enter the process somewhere — and the honest answer is that it enters through a designer, long before you open the tool.",
          "That's what a human-designed template is: someone chose the type scale, tuned how long a point holds on screen, decided what moves and what stays still, and then that judgement gets applied to every video you make. It's the same reason a good newsletter template beats a blank page — the decisions were made once, by someone paying attention.",
          "The alternative is a model choosing the layout, colour, and pacing fresh each time, which produces the average of every video it has seen. The average of everything is exactly what slop looks like. Nobody designed it, so it belongs to nobody.",
        ],
      },
      {
        heading: "Two tools that pass the filter",
        paragraphs: [
          "Blog2Video is built for written publishing. You give it a post, a newsletter issue, or a URL, and it follows your actual structure into designed templates rather than generating something adjacent to your topic. It's the one to use if your content lives as writing on the web — and it carries a longer version of this argument about what separates the category.",
          "A disclosure worth making plainly: BlogHub and Blog2Video come from the same team, so treat this as a recommendation from an interested party and run the two questions above on it yourself.",
        ],
        ctaPath: "https://blog2video.app",
        ctaLabel: "Turn a post into video with Blog2Video",
      },
      {
        heading: "If your content is a document rather than a post",
        paragraphs: [
          "Plenty of publishers work in files rather than posts — a research summary, a report, a deck, a set of lecture notes. Documents are actually the harder test for this category, because a document contains facts a reader can go and verify, so anything the tool invented becomes obvious.",
          "PDF2Vid is the version pointed at that case: same programmatic rendering and designed templates, but the source is a file instead of a URL.",
        ],
        ctaPath: "https://pdf2vid.com",
        ctaLabel: "Turn a document into video with PDF2Vid",
      },
      {
        heading: "Then make sure the video is findable",
        paragraphs: [
          "A good video that nobody encounters is the same as no video. The point of repurposing is reach — publishing to YouTube, TikTok, Instagram, or LinkedIn puts your ideas in front of people who will never stumble onto your archive, and routes the interested ones back to the writing.",
          "That's the same job BlogHub does on the discovery side: a profile for your publication that both search engines and readers can find, with real links back to your posts. The video widens the top of the funnel, the listing makes sure there's somewhere for it to lead.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "List your publication on BlogHub",
      },
    ],
    faq: [
      {
        question: "What does 'AI slop' actually mean?",
        answer:
          "For a publisher, the useful definition is output that has no relationship to anything you actually wrote — footage and narration assembled around your topic rather than from your post. The tell isn't that it looks artificial. It's that a reader who knows your work can't recognise it in the video.",
      },
      {
        question: "Is using an AI video tool bad for my reputation as a writer?",
        answer:
          "Not inherently. Readers judge whether the video is worth their attention, not how it was produced. What damages you is publishing something generic under your name — which is a function of the tool's method, not of AI being involved.",
      },
      {
        question: "What is programmatic video?",
        answer:
          "Video assembled by code rather than sampled by a model. Layouts are components, your content is the data filling them, and rendering is deterministic — the same post always produces the same video. It's why a number on screen can be traced back to the sentence it came from.",
      },
      {
        question: "Do I need to appear on camera?",
        answer:
          "No. The strongest format for repurposed writing is text and visuals on screen with a narrator, which delivers the idea without turning you into a video presenter. The point is the argument, not your face.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "AI video generators that aren't slop",
        angle: "Evaluation piece for publishers considering video repurposing.",
      },
      {
        channel: "substack",
        title: "Slop is a production method, not a look",
        angle: "Essay version for a writer audience, leading with the reputation stakes.",
      },
      videoAsset(
        "How to spot AI video slop before you publish it",
        "Run the two questions over real sample galleries on screen.",
      ),
    ],
  },

  // ── Directory positioning ────────────────────────────────────────────────
  {
    slug: "why-bloghub-is-the-best-blog-directory",
    title: "Why BlogHub Is the Best Free Blog and Newsletter Directory",
    description:
      "Most blog directories are dead links behind a paywall. Here is what BlogHub does differently — free listings, real dofollow backlinks, a weekly email to every subscriber, and a ranked page for your subject.",
    category: "Distribution",
    publishedAt: "2026-08-20",
    readTime: "7 min read",
    heroEyebrow: "Directories",
    heroTitle: "Why BlogHub is the best free blog directory",
    heroDescription:
      "Nearly every directory a writer is told to submit to fails in one of three ways: it charges, it strips the link, or nobody visits it. BlogHub was built by ruling out all three. Here is exactly what a listing gets you.",
    primaryKeyword: "free blog directory",
    keywordVariant: "paying for a directory listing",
    relatedPaths: [
      "/dashboard",
      "/submit-your-newsletter",
      "/blogs/best-blog-directories",
      "/blogs/best-newsletter-directories",
    ],
    sections: [
      {
        heading: "The three ways a directory wastes your afternoon",
        paragraphs: [
          "If you have ever worked through a list of eighty directory submission sites, you already know the pattern. A third of them are parked domains or 500 errors. Another third want between fifteen and two hundred dollars for a listing on a page that no reader has opened since 2019. The survivors put a nofollow attribute on your link, which means the one durable benefit — telling search engines your publication exists — quietly evaporates.",
          "This is why directory submission has such a bad reputation among writers who have actually tried it. The channel is not broken; the implementations are. A directory only works if a real person browses it, the link it gives you is a real link, and getting listed does not cost more than the traffic is worth.",
          "BlogHub is what you get when you hold those three constraints at once and refuse to trade any of them away.",
        ],
        bullets: [
          "Dead directories — indexed once, abandoned since, worth nothing to anyone.",
          "Paid directories — a listing fee for a page with no browsing audience.",
          "Nofollow directories — visible to readers, invisible to search engines.",
        ],
      },
      {
        heading: "Free, in the way that actually matters",
        paragraphs: [
          "Listing a blog, newsletter, or Substack on BlogHub costs nothing. Not a trial, not a free tier that caps you at one post, not a listing that expires in thirty days unless you upgrade. You submit the publication and it is live.",
          "There is exactly one paid thing on the site — an optional featured slot that puts a single publication site-wide for a week or a month — and it is entirely separate from being listed. Your listing, your profile page, your backlinks, your category ranking, and your inclusion in the weekly email all happen on the free path. The paid slot buys placement you could not otherwise get; it does not buy anything the free listing already gives you.",
          "That distinction is worth being pedantic about, because most directories blur it deliberately. The free tier exists to make the paid tier look necessary. Here the free tier is the product.",
        ],
      },
      {
        heading: "A real backlink — to your publication and to individual posts",
        paragraphs: [
          "Every publication on BlogHub gets its own indexable profile page, and the links on it are ordinary followed links. There is no nofollow attribute anywhere on the site. When you list a blog, you get a crawlable page pointing at your domain, and the posts you add each get their own followed link too.",
          "For an established site this is a rounding error. For a publication in its first year it is often the difference between having a link profile and having none at all — and the first few links are the ones that are hardest to get, because nobody links to a site they have not heard of. That is the specific problem a directory is supposed to solve, and it can only solve it if the link is real.",
          "The profile page is also structured for the thing that increasingly matters more than rankings: being quotable by an answer engine. A page that states plainly what your publication is about, who it is for, and how often it goes out is a page a model can actually cite when someone asks it for good writing on your subject.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "List your publication free",
      },
      {
        heading: "Your listing goes out by email — even if it is not popular",
        paragraphs: [
          "This is the part that has no equivalent on other directories. BlogHub sends its subscribers a weekly digest of the five highest-voted publications of the week. That is standard enough. What is not standard is the second email: a weekly hidden-gems digest of five publications from that week with the fewest votes, which explicitly excludes anything that appeared in the top five.",
          "Read that again, because it inverts how every ranked platform works. On Product Hunt, Hacker News, or any upvote-driven site, being unpopular means being invisible — the ranking is the distribution, so a slow start is a dead start. On BlogHub, a listing that has not caught on gets emailed to the entire subscriber list precisely because it has not caught on.",
          "The practical effect for a new publication is that submitting is not a lottery. You are not hoping to crack a top five against writers with existing audiences. There is a path to the inbox that runs through the bottom of the ranking as well as the top, and both of them are free.",
        ],
        bullets: [
          "Top 5 this week — the highest-voted publications, emailed to every subscriber.",
          "5 hidden gems this week — the lowest-voted ones, emailed to the same list.",
          "The two never overlap, so no publication takes both slots from someone else.",
        ],
      },
      {
        heading: "A ranked page for your subject, not just a category tag",
        paragraphs: [
          "Most directories treat categories as a filter — a dropdown that narrows a list. BlogHub treats each subject as its own page: a standing, publicly crawlable ranking of the publications in that category, ordered by community score and updated daily. Tech, Design, Science, Business, Culture, Finance, Philosophy, History, Self Improvement, and the rest each have one.",
          "The reason this matters is that a category page ranks for the query a reader actually types. Nobody searches for a directory homepage; they search for good newsletters about a subject. A page whose entire job is answering that for one subject has a far better chance of being the result — and of being the source an AI answer pulls from — than a generic index of everything.",
          "So a listing puts you in two places at once: on your own profile page, and on the standing page for your subject. The first is the backlink. The second is where the reader who does not know your name yet is going to find you.",
        ],
        ctaPath: "/submit-your-newsletter",
        ctaLabel: "Add your newsletter to a category",
      },
      {
        heading: "The honest limitations",
        paragraphs: [
          "BlogHub is young, and the subscriber list is a real list rather than a large one. If you are looking for a channel that will send ten thousand readers this week, this is not it, and any directory that tells you otherwise is lying to you about a channel that has never worked that way for anyone.",
          "What a listing reliably gives you is a permanent followed link from an indexable page, a standing position on the ranked page for your subject, and a genuine chance of landing in a weekly email regardless of how many votes you start with. Those compound quietly. They are also, notably, the exact three things the eighty-directory lists promise and almost never deliver.",
          "Submit once, write a description that tells a browsing reader what they get and how often, and let it sit there working. It costs an afternoon at most, and unlike a social post, it does not disappear tomorrow.",
        ],
      },
    ],
    faq: [
      {
        question: "Is BlogHub really free to list on?",
        answer:
          "Yes. Submitting a blog, newsletter, or Substack costs nothing, and the listing does not expire. The only paid option is an optional featured slot that puts one publication site-wide for a week or a month — it is separate from listing, and it does not unlock anything the free listing already includes.",
      },
      {
        question: "Do I get a dofollow backlink from BlogHub?",
        answer:
          "Yes. Every publication gets an indexable profile page, and there is no nofollow attribute on the site — the link to your domain and the links to your individual posts are ordinary followed links.",
      },
      {
        question: "Do I need an existing audience to get anything out of it?",
        answer:
          "No, and this is the main design difference. Alongside the weekly top-five digest, BlogHub emails subscribers a weekly hidden-gems digest drawn from the least-voted publications of that week. A publication with no votes is eligible for that email specifically because it has no votes.",
      },
      {
        question: "How is this different from a general web directory submission site?",
        answer:
          "General directory submission sites list any website in any industry, which is why their pages have no browsing audience and their links carry so little weight. BlogHub only lists publications — blogs, newsletters, and Substacks — so each category page is a genuine reading list rather than a phone book.",
      },
      {
        question: "What should I write in my listing description?",
        answer:
          "Lead with what the reader gets and how often, not what the publication is about. A line like 'every Tuesday, one design teardown you can steal for your own product' outperforms 'a weekly newsletter about design' on every category page, because the browsing reader is scanning for a reason to click.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "Why BlogHub is the best free blog directory",
        angle: "Positioning piece for writers comparing directory options.",
      },
      {
        channel: "substack",
        title: "The directory that emails the posts nobody voted for",
        angle: "Lead with the hidden-gems digest — it inverts how ranked platforms work.",
      },
      videoAsset(
        "Free blog directory with real backlinks",
        "Walk through a listing on screen: profile page, followed link, category ranking, digest.",
      ),
    ],
  },
  {
    slug: "article-submission-sites",
    title: "5 Places to Submit Your Article, Blog, or Newsletter in 2026",
    description:
      "A short, honest list of article submission sites that still work — what each one is for, what it costs you, and what you realistically get back. No eighty-link directory dumps.",
    category: "Distribution",
    publishedAt: "2026-08-20",
    readTime: "8 min read",
    heroEyebrow: "Distribution",
    heroTitle: "5 places to submit your article",
    heroDescription:
      "Every list of article submission sites is either eighty dead links or a pitch for a submission service. This is five places that are actually alive in 2026, and what each one is genuinely good for.",
    primaryKeyword: "article submission sites",
    keywordVariant: "mass-submitting to eighty directories",
    relatedPaths: [
      "/dashboard",
      "/blogs/why-bloghub-is-the-best-blog-directory",
      "/blogs/how-to-submit-your-blog-to-directories",
      "/blogs/best-newsletter-directories",
    ],
    sections: [
      {
        heading: "First, why the eighty-site lists do not work any more",
        paragraphs: [
          "Article submission was a real SEO tactic once. You wrote a 500-word piece, pushed it to a few hundred article directories with a keyword-stuffed author bio, and collected the links. Google's Panda update in 2011 ended that, and the follow-up penalties finished off the directories themselves. The lists survived; the sites on them did not.",
          "So when you find a post promising 100+ free article submission sites, what you are looking at is a list that has been copied forward for a decade without anyone opening the links. Most are dead. The live ones are usually link farms, and submitting to a link farm is not neutral — it associates your domain with a bad neighbourhood.",
          "The tactic that replaced it is smaller and slower: a handful of places where a real audience browses, each one submitted to properly. Five done well beats eighty pasted. Here are the five that are worth the afternoon.",
        ],
      },
      {
        heading: "1. A publication directory — for the permanent link",
        paragraphs: [
          "The closest modern equivalent to the old article directory is a directory of publications rather than of individual articles. You list the blog, newsletter, or Substack once, and it keeps working: an indexable profile page, a followed link to your domain, and a standing position on a ranked page for your subject.",
          "This is the highest-leverage item on the list because it is the only one that is permanent and unattended. A community post is gone in a day and a republished article needs writing. A directory listing is submitted once and continues to be crawled, browsed, and linked for as long as it is up.",
          "BlogHub is the one we build, so treat this as the disclosure it is — but the criteria are the ones to judge any directory by. Is listing free, is the outbound link followed rather than nofollowed, does a real reader ever browse the category page, and is there any route to distribution that does not require you to already be popular?",
        ],
        bullets: [
          "Free to list, with no expiring listing or upgrade gate.",
          "Followed links to your domain and to individual posts.",
          "A ranked, crawlable page for your subject — not just a dropdown filter.",
          "A weekly email that includes low-vote publications, not only the top five.",
        ],
        ctaPath: "/dashboard",
        ctaLabel: "Submit your publication free",
      },
      {
        heading: "2. Newsletter directories and aggregators — if you send email",
        paragraphs: [
          "If what you publish arrives in an inbox, there is a second category open to you that pure bloggers do not get: the newsletter directories and aggregators. Letterlist, Newsletter Hunt, The Sample, and the handful of others that are still maintained all take submissions, and most are free.",
          "Know which of the two you are submitting to, because the trade is different. A directory lists you so readers subscribe on your own platform — you get the subscriber and the email address. An aggregator pulls your issues into its own feed or inbox, so readers consume you there and you generally do not get the address. Reach without the relationship is still worth something, but it is not the same thing, and if your time is limited the directories come first.",
          "The practical warning is that this category has heavy churn. Half the names on any list from two years ago are gone. Open each one before you spend time on a submission form, and skip anything whose most recent listing is from last year.",
        ],
      },
      {
        heading: "3. Medium and dev.to — republishing, with the canonical tag set",
        paragraphs: [
          "Republishing a post you already own onto a large platform is the closest thing to genuine article submission that still functions. Medium reaches a general audience, dev.to reaches a technical one, and both have distribution you cannot build yourself in year one.",
          "The one non-negotiable is the canonical tag. Both platforms support importing a post with a canonical URL pointing back at your original, which tells search engines your version is the source. Skip that and you are competing with yourself, usually losing, because the platform outranks you on your own words.",
          "Set the canonical, publish the full piece rather than a teaser, and treat any traffic as a bonus on top of the link. The mistake is treating these as a substitute for having your own site. They are a second front door, not the house.",
        ],
      },
      {
        heading: "4. Niche communities — high value, and the easiest to get wrong",
        paragraphs: [
          "Hacker News, Lobsters, Indie Hackers, and tightly-moderated subreddits send the most engaged readers of anything on this list. They are also the fastest way to lose an account. Most of these communities treat a link to your own work as self-promotion regardless of your history, and enforcement is not proportional — a single post can end an eight-year-old account with no warning and no meaningful appeal.",
          "The version that works is slow. Be a genuine participant for weeks before you ever link out, read the specific rules of the specific community rather than assuming, and post the thing that is most useful to that audience rather than the thing you most want traffic to.",
          "Judge this channel as a place you are a guest in, not a distribution channel you operate. When it works it is the best traffic you will get all month. It is simply not something you can schedule.",
        ],
      },
      {
        heading: "5. Video platforms — where the article becomes the submission",
        paragraphs: [
          "YouTube Shorts, TikTok, and Instagram Reels are the largest discovery surfaces left on the consumer internet, and none of them will do anything with a paragraph. Screenshots of text underperform, quote carousels plateau, and a link in bio converts badly enough that it rarely justifies the effort on its own.",
          "That does not mean writers are locked out. It means the submission format has to change: the article becomes a short narrated video, and the video earns the reach the paragraph never could. This is the only channel on the list where the ceiling is genuinely high for someone starting from zero, because the algorithms there still show new accounts to strangers.",
          "The obvious objection is that producing video is a second job. It is — unless the video is generated from the post you already wrote rather than shot from scratch. That is the specific gap Blog2Video was built for: the writing is done, and turning it into a short should not cost you a production day.",
        ],
        ctaPath: "https://blog2video.app/blog-to-shorts",
        ctaLabel: "Turn a post into shorts",
      },
      {
        heading: "How to actually work through the list",
        paragraphs: [
          "Do them in order of permanence, not excitement. The directory listing takes twenty minutes and then works forever, so it goes first. Newsletter directories are next if you send email. Republishing is an hour per post and worth doing for your best three or four pieces, not everything.",
          "Communities and video are ongoing rather than one-off, so start them only once the permanent items are done. The failure mode for most writers is spending three months on the two channels that require constant feeding while the two that would have worked unattended sit unsubmitted.",
          "And resist the completionist urge. There is no version of this where submitting to the eighty-site list beats doing these five properly — the eighty-site list is how the tactic got its reputation in the first place.",
        ],
      },
    ],
    faq: [
      {
        question: "Do article submission sites still work for SEO in 2026?",
        answer:
          "Mass article directory submission has not worked since Google's Panda update in 2011, and the surviving sites are mostly link farms that can actively hurt you. What still works is a small number of curated, genuinely browsed directories and platforms — quality and relevance rather than volume.",
      },
      {
        question: "Where can I submit an article for free?",
        answer:
          "A publication directory such as BlogHub, the maintained newsletter directories if you send email, and republishing platforms like Medium and dev.to are all free. Between them they cover the permanent backlink, reader discovery, and borrowed distribution.",
      },
      {
        question: "Will submitting my article to directories hurt my rankings?",
        answer:
          "It can, if the directories are link farms or mass-submission services — those patterns are exactly what the algorithm updates were built to catch. A handful of listings on curated, relevant sites is safe and helpful. The test is whether a real person would ever browse the page your link sits on.",
      },
      {
        question: "Should I republish my whole article or just a summary?",
        answer:
          "Republish the whole thing, with a canonical tag pointing back to your original. Teasers convert poorly because readers on those platforms want to read there, and without the canonical tag the platform's copy competes with yours in search — usually winning.",
      },
      {
        question: "How many places should I submit each article to?",
        answer:
          "Per article, one or two republishing destinations at most. The directory listing is per publication rather than per article, so it is done once. Beyond that you hit diminishing returns fast, and duplicate copies without canonical tags start working against you.",
      },
    ],
    distributionPlan: [
      {
        channel: "site",
        title: "5 places to submit your article, blog, or newsletter",
        angle: "Evergreen list post targeting writers researching article submission sites.",
      },
      {
        channel: "substack",
        title: "The eighty-directory list is why nobody trusts directories",
        angle: "Open with the Panda history, then the five that survived.",
      },
      videoAsset(
        "5 places to submit your article in 2026",
        "One card per destination with the cost, the effort, and what you get back.",
      ),
    ],
  },
];
