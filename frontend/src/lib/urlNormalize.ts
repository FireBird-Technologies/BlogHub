/**
 * Normalize any URL to canonical base site URL (scheme + host only).
 *
 * Platform-hosted publications (Medium, LinkedIn) keep the publication-identifying
 * path prefix so distinct publications don't collapse to a shared bare host.
 * Keep these rules in sync with backend/app/helpers/url_normalize.py.
 *
 *   medium.com/@handle/post        -> medium.com/@handle
 *   medium.com/the-pub/post        -> medium.com/the-pub
 *   <sub>.medium.com/post          -> <sub>.medium.com   (subdomain is the publication)
 *   linkedin.com/<anything>        -> full URL kept as-is (posts are deep-linked)
 */
function platformCanonical(
  host: string,
  scheme: string,
  path: string,
  query: string,
): string | null {
  const segments = (path || "").split("/").filter(Boolean);

  // Medium subdomains (e.g. acme.medium.com): the subdomain is the publication.
  if (host.endsWith(".medium.com") && host !== "www.medium.com") {
    return `${scheme}://${host}`;
  }

  if (host === "medium.com") {
    return segments.length ? `${scheme}://${host}/${segments[0]}` : `${scheme}://${host}`;
  }

  // LinkedIn posts are deep-linked; keep the full URL (path + query) so distinct
  // posts stay distinct. Strip only a trailing slash for a stable dedup key.
  if (host === "linkedin.com") {
    let full = `${scheme}://${host}${path || ""}`.replace(/\/+$/, "");
    if (query) full = `${full}?${query}`;
    return full;
  }

  return null;
}

export function normalizePublicationUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  const withScheme = raw.includes("://") ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    let host = parsed.hostname.toLowerCase();
    if (!host) return "";
    const scheme = parsed.protocol === "http:" ? "http" : "https";
    const query = parsed.search.replace(/^\?/, "");

    let platform = platformCanonical(host, scheme, parsed.pathname, query);
    if (platform !== null) return platform;

    if (host.startsWith("www.")) host = host.slice(4);
    // linkedin.com may arrive as www.linkedin.com; re-check after www strip.
    platform = platformCanonical(host, scheme, parsed.pathname, query);
    if (platform !== null) return platform;

    return `${scheme}://${host}`;
  } catch {
    return "";
  }
}

/**
 * Normalize an arbitrary link, keeping its full path — unlike
 * `normalizePublicationUrl`, which deliberately collapses to the bare site because
 * it identifies a *publication*. A featured "link" can be a specific product page,
 * article, or landing page, so shortening it would advertise the wrong destination.
 * Keep in sync with `normalize_link_url` in backend/app/helpers/url_normalize.py.
 */
export function normalizeLinkUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  const withScheme = raw.includes("://") ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    const host = parsed.hostname.toLowerCase();
    if (!host) return "";
    const scheme = parsed.protocol === "http:" ? "http" : "https";
    const query = parsed.search.replace(/^\?/, "");
    let full = `${scheme}://${host}${parsed.pathname || ""}`;
    if (query) full = `${full}?${query}`;
    return full;
  } catch {
    return "";
  }
}
