import { CATEGORY_COLORS, formatCategoryDisplay } from "../../constants/categories";

interface BadgeProps {
  category: string;
  className?: string;
}

export default function Badge({ category, className = "" }: BadgeProps) {
  const label = formatCategoryDisplay(category);
  const colorClass = CATEGORY_COLORS[label] ?? CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
