from urllib.parse import urlparse


def normalize_publication_url(url: str) -> str:
    """Normalize any URL to its canonical base site URL (scheme + host only).

    e.g. https://www.firebirdtech.com/blog/this-post -> https://firebirdtech.com
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
        if host.startswith("www."):
            host = host[4:]
        scheme = (parsed.scheme or "https").lower()
        if scheme not in ("http", "https"):
            scheme = "https"
        return f"{scheme}://{host}"
    except Exception:
        return ""


# Backwards-compatible alias
normalize_publication_url_key = normalize_publication_url
