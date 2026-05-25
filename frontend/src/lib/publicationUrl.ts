const SHORT_ID_LEN = 8;
const MAX_SLUG_LEN = 60;
const SHORT_ID_RE = /([0-9a-f]{8})$/i;

export function publicationSlug(title: string | undefined): string {
  return (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LEN)
    .replace(/-+$/g, "");
}

export function publicationShortId(id: string): string {
  return id.replace(/-/g, "").slice(0, SHORT_ID_LEN).toLowerCase();
}

export function publicationPath(pub: { id: string; title: string }): string {
  const slug = publicationSlug(pub.title);
  const shortId = publicationShortId(pub.id);
  return slug ? `/publications/${slug}-${shortId}` : `/publications/${shortId}`;
}

/** Extract the trailing 8-char hex short id from a /publications/:slug url param. */
export function parseShortIdFromParam(param: string | undefined): string | undefined {
  if (!param) return undefined;
  const m = param.match(SHORT_ID_RE);
  return m ? m[1].toLowerCase() : undefined;
}
