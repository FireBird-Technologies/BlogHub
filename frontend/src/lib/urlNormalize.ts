/** Normalize any URL to canonical base site URL (scheme + host only). */
export function normalizePublicationUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  const withScheme = raw.includes("://") ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    if (!host) return "";
    const scheme = parsed.protocol === "http:" ? "http" : "https";
    return `${scheme}://${host}`;
  } catch {
    return "";
  }
}
