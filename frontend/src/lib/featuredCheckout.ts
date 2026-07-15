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
