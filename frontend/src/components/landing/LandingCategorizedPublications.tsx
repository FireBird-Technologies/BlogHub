import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "../../constants/categories";
import { categoryPath, CUSTOM_CATEGORY } from "../../lib/categoryUrl";

const TILES: { label: string; category: string }[] = [
  ...CATEGORIES.map((category) => ({ label: category, category })),
  { label: "Others", category: CUSTOM_CATEGORY },
];

export default function LandingCategorizedPublications() {
  return (
    <section className="pt-14 pb-8 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Browse by category</h2>
          <p className="text-base sm:text-lg text-gray-400 mt-3 leading-relaxed">
            Pick a topic to see its top-ranked publications.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-6xl mx-auto">
          {TILES.map(({ label, category }) => (
            <Link
              key={label}
              to={categoryPath(category)}
              className="group relative flex items-center justify-between gap-2 px-4 py-5 text-left text-sm text-gray-500 transition-colors hover:text-gray-900
                         border-r border-gray-100 [&:nth-child(2n)]:border-r-0
                         sm:[&:nth-child(2n)]:border-r sm:[&:nth-child(3n)]:border-r-0
                         lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r lg:[&:nth-child(5n)]:border-r-0
                         after:absolute after:bottom-0 after:left-4 after:right-4 after:border-b after:border-gray-100"
            >
              <span className="underline-offset-4 group-hover:underline truncate">{label}</span>
              <ArrowUpRight
                size={14}
                className="flex-shrink-0 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
