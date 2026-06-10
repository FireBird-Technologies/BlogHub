/** Sentinel used by the backend to filter publications whose category is not builtin. */
export const CUSTOM_CATEGORY = "__custom__";

/** URL slug used for the "Others" (custom categories) ranking page. */
const OTHERS_SLUG = "others";

/** Build the ranking-page path for a category ("__custom__" → /category/others). */
export function categoryPath(category: string): string {
  if (category === CUSTOM_CATEGORY) return `/category/${OTHERS_SLUG}`;
  return `/category/${encodeURIComponent(category)}`;
}

/** Resolve a :category route param into the API filter value and display title. */
export function resolveCategoryParam(raw: string | undefined): { apiCategory: string; title: string } {
  if (!raw || raw === OTHERS_SLUG) return { apiCategory: CUSTOM_CATEGORY, title: "Others" };
  const decoded = decodeURIComponent(raw);
  return { apiCategory: decoded, title: decoded };
}
