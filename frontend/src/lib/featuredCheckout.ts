export const POST_LOGIN_PATH_KEY = "bloghub_post_login_path";
export const FEATURE_DURATION_PARAM = "feature";
/** Carries the booking id from the "your slot ends today" email into the renewal modal. */
export const RENEW_SLOT_PARAM = "renew";

export function renewDashboardPath(slotId: string): string {
  return `/dashboard?${RENEW_SLOT_PARAM}=${slotId}`;
}

/** Carries the publication URL from the "refresh your listing" email into the submit
 *  modal, so the author lands on the resubmit flow with the URL already filled in. */
export const RESUBMIT_URL_PARAM = "resubmit";

/** Id of the account the reminder email was addressed to. Carried as a reference so
 *  the dashboard can detect "you followed this link on a different account" without a
 *  round trip. Not a credential — every write is still authorized server-side. */
export const RESUBMIT_OWNER_PARAM = "owner";

export function resubmitDashboardPath(url: string, ownerId?: string | null): string {
  const base = `/dashboard?${RESUBMIT_URL_PARAM}=${encodeURIComponent(url)}`;
  return ownerId ? `${base}&${RESUBMIT_OWNER_PARAM}=${encodeURIComponent(ownerId)}` : base;
}

/** Sign out and come back to the same resubmit link, so an author who followed the
 *  reminder email on the wrong Google account can switch without losing the intent.
 *
 *  The path is stashed under POST_LOGIN_PATH_KEY — the same key the signed-out branch
 *  of the deep link uses — so login returns here and re-runs the ownership check
 *  against the newly chosen account. */
export function switchAccountForResubmit(
  url: string,
  logout: () => void,
  ownerId?: string | null,
): void {
  try {
    sessionStorage.setItem(POST_LOGIN_PATH_KEY, resubmitDashboardPath(url, ownerId));
  } catch {
    /* private mode: they land on the dashboard and can resubmit manually */
  }
  logout();
}

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
