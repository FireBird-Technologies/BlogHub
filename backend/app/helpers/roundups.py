import re
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.publication import Publication
from app.models.roundup import FeaturedRoundup

MONTHLY_LIMIT = 5


def slugify(value: str) -> str:
    """Lowercase, hyphenate, strip non-alphanumerics. Matches sitemap._slugify style."""
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return slug


def previous_month_start(now: datetime | None = None) -> date:
    """First day (UTC) of the *previous* calendar month.

    Roundups are generated for the month that just ended (the cron runs on the 1st),
    so a complete month of data is available. Stored in the FeaturedRoundup.week_start
    column, whose unique constraint with `category` yields one roundup per category
    per month.
    """
    now = now or datetime.now(timezone.utc)
    first_of_this_month = now.date().replace(day=1)
    if first_of_this_month.month == 1:
        return first_of_this_month.replace(year=first_of_this_month.year - 1, month=12)
    return first_of_this_month.replace(month=first_of_this_month.month - 1)


def next_month_start(month_start: date) -> date:
    """First day of the month after `month_start` — the exclusive upper bound."""
    if month_start.month == 12:
        return month_start.replace(year=month_start.year + 1, month=1)
    return month_start.replace(month=month_start.month + 1)


def roundup_slug(category: str, month_start: date) -> str:
    return f"top-{slugify(category)}-blogs-{month_start.strftime('%Y-%m')}"


def roundup_title(category: str, month_start: date) -> str:
    pretty = month_start.strftime("%B %Y")
    return f"Top {category} Blogs — {pretty}"


async def already_featured_ids(db: AsyncSession) -> set[uuid.UUID]:
    """Every publication id that has appeared in any past roundup (no-duplicates guard)."""
    result = await db.execute(select(FeaturedRoundup.publication_ids))
    featured: set[uuid.UUID] = set()
    for (ids,) in result.all():
        for raw in ids or []:
            try:
                featured.add(uuid.UUID(str(raw)))
            except (ValueError, AttributeError):
                continue
    return featured


async def _distinct_categories(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(Publication.category).distinct().order_by(Publication.category)
    )
    return [row[0] for row in result.all()]


async def top_for_month_per_category(
    db: AsyncSession,
    category: str,
    exclude_ids: set[uuid.UUID],
    *,
    month_start: date,
    month_end: date,
    ascending: bool = False,
) -> list[Publication]:
    """Up to MONTHLY_LIMIT publications in `category` created within the given month,
    ranked by engagement (upvotes + comments), excluding anything in `exclude_ids`.

    `ascending=False` (default) returns the highest-scored "top" picks; `exclude_ids`
    is the cross-month no-duplicates guard. `ascending=True` returns the lowest-scored
    "underrated" picks; here `exclude_ids` must include this month's top picks so a
    publication never appears in both columns of the same roundup. May be empty.
    """
    cc_sub = (
        select(Comment.publication_id, func.count(Comment.id).label("cnt"))
        .group_by(Comment.publication_id)
        .subquery("cc")
    )
    score_expr = Publication.upvote_count + func.coalesce(cc_sub.c.cnt, 0)
    score_order = score_expr.asc() if ascending else score_expr.desc()

    stmt = (
        select(Publication)
        .outerjoin(cc_sub, Publication.id == cc_sub.c.publication_id)
        .where(Publication.category == category)
        .where(Publication.created_at >= month_start)
        .where(Publication.created_at < month_end)
        .order_by(score_order, Publication.created_at.desc(), Publication.id.desc())
    )
    if exclude_ids:
        stmt = stmt.where(Publication.id.notin_(exclude_ids))
    stmt = stmt.limit(MONTHLY_LIMIT)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def generate_roundups(db: AsyncSession) -> dict:
    """Create last month's roundup pages, one per category with publications.

    Runs on the 1st and targets the month that just ended, so a full month of data
    is available. Idempotent: skips any (category, month) that already exists, and
    never re-features a publication included in a prior roundup. Existing roundups
    are never modified or deleted — they accumulate month over month. Categories with
    no qualifying publications produce no page. Returns a summary of what was created.
    """
    month_start = previous_month_start()
    month_end = next_month_start(month_start)

    existing = await db.execute(
        select(FeaturedRoundup.category).where(FeaturedRoundup.week_start == month_start)
    )
    existing_categories = {row[0] for row in existing.all()}

    exclude_ids = await already_featured_ids(db)
    created: list[dict] = []

    for category in await _distinct_categories(db):
        if category in existing_categories:
            continue
        top_pubs = await top_for_month_per_category(
            db, category, exclude_ids, month_start=month_start, month_end=month_end
        )
        top_ids = [p.id for p in top_pubs]
        # Underrated must exclude both prior-month features (exclude_ids) and this
        # month's top picks, so no publication lands in both columns of one roundup.
        underrated_pubs = await top_for_month_per_category(
            db, category, exclude_ids | set(top_ids),
            month_start=month_start, month_end=month_end, ascending=True,
        )
        if not top_pubs and not underrated_pubs:
            continue

        underrated_ids = [p.id for p in underrated_pubs]
        roundup = FeaturedRoundup(
            slug=roundup_slug(category, month_start),
            category=category,
            week_start=month_start,
            title=roundup_title(category, month_start),
            publication_ids=[str(pid) for pid in top_ids],
            underrated_ids=[str(pid) for pid in underrated_ids],
        )
        db.add(roundup)
        # Reserve the *top* ids so a later category in the same run can't reuse them
        # (a publication only lives in one category, but this keeps the guard total).
        # Underrated picks are intentionally not reserved — they're pure lowest score.
        exclude_ids.update(top_ids)
        created.append(
            {
                "category": category,
                "slug": roundup.slug,
                "count": len(top_ids),
                "underrated_count": len(underrated_ids),
            }
        )

    await db.commit()
    return {"created": len(created), "roundups": created, "month": month_start.strftime("%Y-%m")}
