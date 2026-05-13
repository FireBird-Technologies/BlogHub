import { motion } from "framer-motion";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import { ChevronUp } from "lucide-react";

const MOCK = [
  {
    id: 1,
    title: "The unreasonable effectiveness of just showing up every day",
    description:
      "Consistency beats talent in almost every domain. Here's the science behind why showing up matters more than being exceptional.",
    category: "Culture",
    upvote_count: 312,
    author: { name: "Alex Kim" },
  },
  {
    id: 2,
    title: "How I rebuilt my design system with zero dependencies",
    description:
      "A deep-dive into removing third-party libraries and building something that truly belongs to your team.",
    category: "Design",
    upvote_count: 204,
    author: { name: "Priya Sharma" },
  },
  {
    id: 3,
    title: "Large language models are not as smart as we think — and that's fine",
    description:
      "A grounded take on where AI actually stands today and why managing expectations leads to better applications.",
    category: "Tech",
    upvote_count: 541,
    author: { name: "James Okoro" },
  },
] as const;

function MockCard({ pub }: { pub: (typeof MOCK)[number] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      <div className="aspect-video bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="text-red-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"
            />
          </svg>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Badge category={pub.category} />
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{pub.title}</p>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{pub.description}</p>
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar name={pub.author.name} size={24} />
            <span className="text-xs text-gray-400">{pub.author.name}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
            <ChevronUp size={13} />
            <span>{pub.upvote_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewSection() {
  return (
    <section id="preview" className="py-16 px-4 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900">See what's trending</h2>
          <p className="text-gray-400 mt-2">A glimpse of what the community is reading right now.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {MOCK.map((pub) => (
            <MockCard key={pub.id} pub={pub} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
