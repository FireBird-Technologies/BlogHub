import { motion } from "framer-motion";
import { Link2, Users, TrendingUp, Sparkles } from "lucide-react";

interface AboutCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const aboutCards: AboutCard[] = [
  {
    icon: <Link2 size={28} className="text-red-600" />,
    title: "Build Backlinks",
    description:
      "Get quality backlinks from a curated directory. Every publication you submit creates a permanent link back to your site, boosting SEO.",
  },
  {
    icon: <Users size={28} className="text-red-600" />,
    title: "Reach Real Readers",
    description:
      "Connect with thousands of curious readers actively looking for great content. Get genuine traffic to your blog or newsletter.",
  },
  {
    icon: <TrendingUp size={28} className="text-red-600" />,
    title: "Grow Audience",
    description:
      "Featured publications get exposure to a growing community of readers. Build your subscriber base and increase your reach.",
  },
  {
  icon: <Sparkles size={28} className="text-red-600" />,
    title: "Rank Higher in AI Search",
    description:
      "Every publication gets a clean page that SEO crawlers and AI engines index easily."
  },
];

export default function LandingAboutSection() {
  return (
    <section className="relative bg-white px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-14 sm:pb-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Grow Your Publication
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Submit once and get SEO backlinks, AI-search visibility, and real readers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {aboutCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl p-6 sm:p-7 border border-gray-200 hover:border-red-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-red-50 rounded-lg">
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
