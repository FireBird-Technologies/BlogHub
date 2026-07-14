// UTM tagging for outbound clicks tied to a *featured* publication.
//
// A featured publication is bought and paid for, so the buyer wants to know what
// the slot actually earned them. Tagging every outbound link they own lets their
// own analytics (GA -> Acquisition -> Traffic acquisition) attribute the visit to
// the BlogHub featured slot rather than to generic referral traffic. `utm_source`
// is always "bloghub" — every tagged link originates from us — while `utm_content`
// distinguishes exactly which surface sent the click:
//   "main_link"       — the "Visit publication" button on the detail page
//   "additional_link" — one of the extra link embeds on the detail page
//   "social_link"     — one of the author's social profiles on the detail page
//   "landing_card"    — the featured card on the home page
//   "dashboard_card"  — the featured card on the dashboard
//   (the marketing email uses its own tagging — see backend app/helpers/email.py,
//   utm_content="marketing_email" — since it isn't a click made in the browser here)

const UTM = {
  utm_source: "bloghub",
  utm_medium: "referral",
  utm_campaign: "featured",
} as const;

/** Append the featured-slot UTM params to an outbound URL.
 *
 * Preserves any query string the URL already has, and never overwrites UTM params
 * the author set themselves. Returns the input unchanged if it isn't a parseable
 * absolute http(s) URL, so a malformed link degrades to a plain link rather than
 * breaking the page.
 */
export function withFeaturedUtm(href: string, content: string): string {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return href;
    for (const [key, value] of Object.entries({ ...UTM, utm_content: content })) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return href;
  }
}

/** `withFeaturedUtm` when the publication is featured, otherwise the URL untouched. */
export function outboundUrl(href: string, content: string, isFeatured: boolean): string {
  return isFeatured ? withFeaturedUtm(href, content) : href;
}

/** Count a click on the featured *card*, server-side.
 *
 * Deliberately narrow. This counts one thing only: somebody clicking the featured card
 * on the home page or dashboard to open the publication. It is NOT called from the
 * detail page's outbound links (Visit publication, socials, related links), because
 * mixing those into one figure would make it meaningless — the buyer could not tell
 * how much traffic the featured placement actually sent them from clicks they would
 * have got anyway. Those links are still UTM-tagged, so the author sees them in their
 * own analytics; this counter answers "what did the slot earn me".
 *
 * Uses sendBeacon so the request survives the page unloading; falls back to fetch with
 * keepalive. Best-effort — a failure must never block the navigation.
 */
export function trackFeaturedClick(publicationId: string, isFeatured: boolean): void {
  if (!isFeatured) return;
  const url = `${import.meta.env.VITE_API_URL ?? ""}/api/featured/${publicationId}/click`;
  try {
    if (navigator.sendBeacon?.(url)) return;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  } catch {
    /* never block the outbound navigation */
  }
}
