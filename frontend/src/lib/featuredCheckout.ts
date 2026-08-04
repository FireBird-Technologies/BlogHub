export const POST_LOGIN_PATH_KEY = "bloghub_post_login_path";
export const FEATURE_DURATION_PARAM = "feature";

export const FEATURE_DURATIONS = [7, 14, 30] as const;
export type FeatureDuration = (typeof FEATURE_DURATIONS)[number];

export function featureDashboardPath(days: FeatureDuration): string {
  return `/dashboard?${FEATURE_DURATION_PARAM}=${days}`;
}

export function parseFeatureDuration(value: string | null): FeatureDuration | null {
  const n = Number(value);
  if (n === 7 || n === 14 || n === 30) return n;
  return null;
}

export function isFeatureDuration(days: number): days is FeatureDuration {
  return days === 7 || days === 14 || days === 30;
}

/** Clicks our last featured advertiser earned in a week — the only real number we
 *  have, so every longer run is that week scaled up rather than a separate claim. */
const CLICKS_PER_WEEK = [50, 80] as const;

/** Estimated outbound clicks for a run of `days`, as a display range ("100–160").
 *
 * Rounded to the nearest 5 so it reads as the estimate it is: a precise-looking
 * "214–343" would imply we can predict a run to the click.
 */
export function estimatedClicksLabel(days: number): string {
  const weeks = days / 7;
  const round5 = (n: number) => Math.round((n * weeks) / 5) * 5;
  return `${round5(CLICKS_PER_WEEK[0])}–${round5(CLICKS_PER_WEEK[1])}`;
}
