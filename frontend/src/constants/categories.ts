export const CATEGORIES = [
  "Tech",
  "Design",
  "Science",
  "Business",
  "Culture",
  "Health",
  "Education",
  "Finance",
  "Entertainment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export const CATEGORY_COLORS: Record<string, string> = {
  Tech: "bg-blue-50 text-blue-700 border-blue-200",
  Design: "bg-violet-50 text-violet-700 border-violet-200",
  Science: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Business: "bg-amber-50 text-amber-700 border-amber-200",
  Culture: "bg-pink-50 text-pink-700 border-pink-200",
  Health: "bg-green-50 text-green-700 border-green-200",
  Education: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Finance: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Entertainment: "bg-red-50 text-red-700 border-red-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};
