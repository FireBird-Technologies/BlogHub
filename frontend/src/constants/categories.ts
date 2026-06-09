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
  "Fashion",
  "Politics",
  "Philosophy",
  "Economics",
  "History",
  "Biology",
  "Life Sciences",
  "Physics",
  "Maths",
  "Chemistry",
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
  Fashion: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  Politics: "bg-slate-50 text-slate-700 border-slate-200",
  Philosophy: "bg-stone-50 text-stone-700 border-stone-200",
  Economics: "bg-orange-50 text-orange-700 border-orange-200",
  History: "bg-amber-50 text-amber-700 border-amber-200",
  Biology: "bg-lime-50 text-lime-700 border-lime-200",
  "Life Sciences": "bg-teal-50 text-teal-700 border-teal-200",
  Physics: "bg-sky-50 text-sky-700 border-sky-200",
  Maths: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Chemistry: "bg-purple-50 text-purple-700 border-purple-200",
};
