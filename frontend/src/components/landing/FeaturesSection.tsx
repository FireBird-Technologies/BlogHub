import { motion } from "framer-motion";
import { Search, Share2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Browse a curated stream of articles, essays, and long-reads across tech, design, science, and beyond.",
  },
  {
    icon: Share2,
    title: "Share",
    description:
      "Submit any URL and we'll pull the title, description, and preview image automatically. One click to publish.",
  },
  {
    icon: Users,
    title: "Connect",
    description:
      "Upvote what resonates, follow topics you care about, and build a taste profile the community trusts.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Built for curious readers</h2>
          <p className="text-gray-500 mt-3 text-lg">Everything you need to find and share quality writing.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4
                         hover:border-red-200 hover:shadow-md hover:shadow-red-600/5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <f.icon size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
