"""Optional Gemini expansion of scraped descriptions (server-side only)."""

from __future__ import annotations

import asyncio
import logging

from app.settings import settings

logger = logging.getLogger(__name__)

# Static fallbacks when ListModels is unavailable. Prefer current AI Studio models for new keys.
_MODEL_FALLBACKS = (
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-pro-preview",
)


def _normalize_model_id(name: str) -> str:
    return name.removeprefix("models/").strip()


def _list_usable_models(genai) -> list[str]:
    """Return model ids that support generateContent, best-first for summaries."""
    ids: list[str] = []
    try:
        for m in genai.list_models():
            methods = getattr(m, "supported_generation_methods", None) or ()
            if "generateContent" not in methods:
                continue
            ids.append(_normalize_model_id(m.name))
    except Exception as exc:
        logger.debug("Could not list Gemini models: %s", exc)
        return []

    def sort_key(mid: str) -> tuple[int, str]:
        s = mid.lower()
        tier = 5
        if "gemini-3" in s:
            tier = 0
        elif "2.5" in s:
            tier = 1
        elif "flash" in s:
            tier = 2
        elif "pro" in s:
            tier = 3
        experimental = "preview" in s or "exp" in s
        return (
            tier,
            0 if experimental else 1,
            len(mid),
            mid,
        )

    ids = list(dict.fromkeys(ids))
    ids.sort(key=sort_key)
    return ids


def _ordered_model_candidates(genai=None) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    primary = (getattr(settings, "GEMINI_MODEL", None) or "").strip()
    if primary:
        out.append(primary)
        seen.add(primary)

    if genai is not None:
        for m in _list_usable_models(genai):
            if m not in seen:
                out.append(m)
                seen.add(m)

    for m in _MODEL_FALLBACKS:
        if m not in seen:
            out.append(m)
            seen.add(m)
    return out


async def enrich_scraped_description(
    *,
    url: str,
    title: str | None,
    description: str | None,
) -> str | None:
    """
    Return a longer plain-text summary, or None to keep the original description.
    Never raises; logs and returns None on any failure.
    """
    key = settings.GEMINI_API_KEY
    if not key:
        return None

    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google-generativeai not installed; skipping Gemini enrichment")
        return None

    genai.configure(api_key=key)

    prompt = f"""You help summarize articles for a reading list.

Page URL: {url}
Title: {title or "(unknown)"}
Existing meta description or snippet: {description or "(none)"}

Write 2 to 4 sentences of plain text only: what the article covers and why it might interest a technical or curious reader. No markdown, no bullet points, no title line, no quotes around the whole answer."""

    def _generate_with_model(model_name: str) -> str:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        try:
            raw = response.text or ""
        except (ValueError, AttributeError):
            return ""
        return raw.strip()

    def _try_models() -> str:
        errors: list[str] = []
        for name in _ordered_model_candidates(genai):
            try:
                text = _generate_with_model(name)
                if text:
                    logger.debug("Gemini enrichment used model %s", name)
                    return text
            except Exception as exc:
                msg = str(exc).replace("\n", " ")
                if len(msg) > 200:
                    msg = msg[:200] + "…"
                errors.append(f"{name}: {msg}")
                continue
        if errors:
            logger.warning(
                "Gemini description enrichment failed for all models (showing first 4): %s",
                "; ".join(errors[:4]),
            )
        return ""

    try:
        text = await asyncio.wait_for(asyncio.to_thread(_try_models), timeout=55.0)
        if not text:
            return None
        if len(text) > 6000:
            text = text[:6000]
        return text
    except asyncio.TimeoutError:
        logger.warning("Gemini description enrichment timed out")
        return None
    except Exception as exc:
        logger.warning("Gemini description enrichment failed: %s", exc)
        return None
