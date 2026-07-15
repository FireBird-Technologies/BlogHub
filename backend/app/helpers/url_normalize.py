from urllib.parse import urlparse

# Platform-hosted publications live at a sub-path of a shared domain, so we must
# preserve the publication-identifying path prefix instead of collapsing to the
# bare host. Keep these rules in sync with frontend/src/lib/urlNormalize.ts.
#
#   medium.com/@handle/post        -> medium.com/@handle
#   medium.com/the-pub/post        -> medium.com/the-pub
#   <sub>.medium.com/post          -> <sub>.medium.com   (subdomain is the publication)
#   linkedin.com/<anything>        -> full URL kept as-is (posts are deep-linked)


def _platform_canonical(host: str, scheme: str, path: str, query: str = "") -> str | None:
    """Return a platform-specific canonical URL, or None if host is not a platform."""
    segments = [s for s in (path or "").split("/") if s]

    # Medium subdomains (e.g. acme.medium.com): the subdomain is the publication.
    if host.endswith(".medium.com") and host != "www.medium.com":
        return f"{scheme}://{host}"

    if host == "medium.com":
        if segments:
            return f"{scheme}://{host}/{segments[0]}"
        return f"{scheme}://{host}"

    # LinkedIn posts are deep-linked; keep the full URL (path + query) so distinct
    # posts stay distinct. Strip only a trailing slash for a stable dedup key.
    if host == "linkedin.com":
        full = f"{scheme}://{host}{path or ''}".rstrip("/")
        if query:
            full = f"{full}?{query}"
        return full

    return None


def normalize_publication_url(url: str) -> str:
    """Normalize any URL to its canonical base site URL (scheme + host only).

    e.g. https://www.firebirdtech.com/blog/this-post -> https://firebirdtech.com

    Platform-hosted publications (Medium, LinkedIn) keep the publication-identifying
    path prefix so distinct publications don't collapse to a shared bare host.
    """
    raw = (url or "").strip()
    if not raw:
        return ""
    if "://" not in raw:
        raw = f"https://{raw}"
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").lower()
        if not host:
            return ""
        scheme = (parsed.scheme or "https").lower()
        if scheme not in ("http", "https"):
            scheme = "https"

        platform = _platform_canonical(host, scheme, parsed.path, parsed.query)
        if platform is not None:
            return platform

        if host.startswith("www."):
            host = host[4:]
        # linkedin.com may arrive as www.linkedin.com; re-check after www strip.
        platform = _platform_canonical(host, scheme, parsed.path, parsed.query)
        if platform is not None:
            return platform

        return f"{scheme}://{host}"
    except Exception:
        return ""


# Backwards-compatible alias
normalize_publication_url_key = normalize_publication_url


def normalize_link_url(url: str) -> str:
    """Normalize an arbitrary link, keeping its full path — unlike
    `normalize_publication_url`, which deliberately collapses to the bare site
    because it identifies a *publication*. A featured "link" can be a specific
    product page, article, or landing page, so shortening it would advertise the
    wrong destination.
    """
    raw = (url or "").strip()
    if not raw:
        return ""
    if "://" not in raw:
        raw = f"https://{raw}"
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").lower()
        if not host:
            return ""
        scheme = (parsed.scheme or "https").lower()
        if scheme not in ("http", "https"):
            scheme = "https"
        path = parsed.path or ""
        full = f"{scheme}://{host}{path}"
        if parsed.query:
            full = f"{full}?{parsed.query}"
        return full
    except Exception:
        return ""
