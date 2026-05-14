import { motion } from "framer-motion";
import { Search, Share2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: {
  icon: LucideIcon;
  title: string;
  lead: string;
  bullets: string[];
}[] = [
  {
    icon: Search,
    title: "Discover",
    lead:
      "Cut through noise with a single feed of articles, essays, and long reads people actually recommend—not algorithmic clickbait.",
    bullets: [
      "Filter by category (tech, design, science, business, and more) or search by keyword.",
      "See engagement at a glance: upvotes and comments help surface what the community values.",
      "Posts are grouped by day on the dashboard so you can catch up on what mattered recently.",
    ],
  },
  {
    icon: Share2,
    title: "Share",
    lead:
      "Found something worth reading? Paste a URL, preview the metadata we pull, add tags and links, and publish in a few steps.",
    bullets: [
      "Automatic title, description, and thumbnail from the page when the scraper can read them.",
      "Optional related links and social profiles so readers can go deeper or follow the author.",
      "Edit everything later from your profile if the preview needs a tweak or the story updates.",
    ],
  },
  {
    icon: Users,
    title: "Connect",
    lead:
      "BlogHub is built around people who read widely and want to signal quality—not vanity metrics alone.",
    bullets: [
      "Sign in with Google; we issue a short-lived JWT so your session stays simple and secure.",
      "Upvote posts you believe in; comments live on each publication for discussion and context.",
      "Your profile lists what you have shared so others can browse your taste over time.",
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Built for curious readers</h2>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Whether you are hunting for your next deep read or curating links for peers, the same flow applies—find,
            share, and react in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4
                         hover:border-red-200 hover:shadow-md hover:shadow-red-600/5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <f.icon size={20} className="text-red-600" />
              </div>
              <div className="flex flex-col gap-3 min-h-0">
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.lead}</p>
                <ul className="text-sm text-gray-500 space-y-2 leading-relaxed list-disc pl-4 marker:text-red-400">
                  {f.bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
