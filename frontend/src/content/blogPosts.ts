import type { BlogPost, DistributionAsset } from "./seoTypes";

// Source of truth for the BlogHub blog. Add a typed object here and it shows up at
// /blogs (index) and /blogs/<slug> (post) automatically — no CMS, no markdown parsing,
// and NO backend change required.
//
// On `npm run build`, scripts/gen-blog-sitemap.mjs reads this file and regenerates
// public/blog-sitemap.xml, so new posts are crawlable automatically.
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
    relatedPaths: ["/dashboard", "/blogs/how-to-submit-your-blog-to-directories", "/blogs/blog-promotion-sites"],
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
    relatedPaths: ["/dashboard", "/blogs/best-blog-directories", "/blogs/blog-promotion-sites"],
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
];
