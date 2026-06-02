import base64
import re
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import String, Text, bindparam, cast, select, update, func, delete, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.schemas.publication import PublicationOut, PaginatedPublications, SocialLinkOut, UpvoteResponse
from app.schemas.user import UserOut
from app.models.publication import CATEGORIES

SHORT_ID_RE = re.compile(r"^[0-9a-f]{8}$")


async def resolve_publication_short_id(db: AsyncSession, short_id: str) -> uuid.UUID | None:
    """Look up a publication by the first 8 hex chars of its UUID.

    Returns the full UUID if exactly one publication's id starts with this
    prefix, otherwise None. Collisions are vanishingly rare at our scale
    (16^8 = ~4.3B), but we still 404 on ambiguity rather than guess.
    """
    from app.models.publication import Publication

    if not SHORT_ID_RE.fullmatch(short_id):
        return None
    stmt = (
        select(Publication.id)
        .where(cast(Publication.id, String).like(f"{short_id}%"))
        .limit(2)
    )
    result = await db.execute(stmt)
    rows = result.all()
    if len(rows) != 1:
        return None
    return rows[0][0]


# ── cursor helpers ────────────────────────────────────────────────────────────

def encode_cursor(created_at: datetime, pub_id: uuid.UUID) -> str:
    raw = f"{created_at.isoformat()}|{pub_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    iso, uid = raw.split("|", 1)
    return datetime.fromisoformat(iso), uuid.UUID(uid)


def encode_score_cursor(score: int, pub_id: uuid.UUID) -> str:
    raw = f"r:{score}|{pub_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_score_cursor(cursor: str) -> tuple[int, uuid.UUID]:
    raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    _, rest = raw.split(":", 1)
    score_str, uid = rest.split("|", 1)
    return int(score_str), uuid.UUID(uid)


# ── shared helpers ────────────────────────────────────────────────────────────

def _pub_to_out(
    pub,
    upvoted_ids: set[uuid.UUID],
    comment_counts: dict[uuid.UUID, int],
    rank: int | None = None,
) -> PublicationOut:
    raw_social = pub.social_links or []
    social_out = [
        SocialLinkOut(label=str(entry.get("label", "")).strip(), url=str(entry.get("url", "")).strip())
        for entry in raw_social
        if isinstance(entry, dict) and entry.get("url") and str(entry.get("label", "")).strip()
    ]

    return PublicationOut(
        id=pub.id,
        url=pub.url,
        title=pub.title,
        description=pub.description,
        image_url=pub.image_url,
        category=pub.category,
        tags=pub.tags or [],
        additional_links=[str(u) for u in (pub.additional_links or []) if u],
        social_links=social_out,
        upvote_count=pub.upvote_count,
        comment_count=comment_counts.get(pub.id, 0),
        rank=rank,
        is_upvoted=pub.id in upvoted_ids,
        created_at=pub.created_at,
        author=UserOut.model_validate(pub.author),
    )


async def _batch_meta(
    db: AsyncSession,
    pubs: list,
    user_id: uuid.UUID | None,
) -> tuple[set[uuid.UUID], dict[uuid.UUID, int]]:
    """Batch-fetch upvote flags and comment counts for a list of publications."""
    from app.models.upvote import Upvote
    from app.models.comment import Comment

    upvoted_ids: set[uuid.UUID] = set()
    comment_counts: dict[uuid.UUID, int] = {}
    if not pubs:
        return upvoted_ids, comment_counts

    pub_ids = [p.id for p in pubs]

    if user_id:
        uv = await db.execute(
            select(Upvote.publication_id).where(
                and_(Upvote.user_id == user_id, Upvote.publication_id.in_(pub_ids))
            )
        )
        upvoted_ids = {row[0] for row in uv.all()}

    cc = await db.execute(
        select(Comment.publication_id, func.count(Comment.id).label("cnt"))
        .where(Comment.publication_id.in_(pub_ids))
        .group_by(Comment.publication_id)
    )
    comment_counts = {row[0]: row[1] for row in cc.all()}
    return upvoted_ids, comment_counts


# ── main query ────────────────────────────────────────────────────────────────

async def build_publications_query(
    db: AsyncSession,
    *,
    cursor: str | None,
    limit: int,
    category: str | None,
    search: str | None,
    seed: int | None,
    user_id: uuid.UUID | None,
    filter_by_user_id: uuid.UUID | None = None,
    sort: str | None = "ranked",
) -> PaginatedPublications:
    from app.models.publication import Publication
    from app.models.comment import Comment

    if sort == "ranked":
        return await _ranked_query(
            db, cursor=cursor, limit=limit, category=category, search=search,
            user_id=user_id, filter_by_user_id=filter_by_user_id,
        )

    # ── date / seed ordering ─────────────────────────────────────────────────
    stmt = select(Publication).options(selectinload(Publication.author))

    if filter_by_user_id:
        stmt = stmt.where(Publication.user_id == filter_by_user_id)
    if category:
        if category == "__custom__":
            # Show all custom categories (not in predefined list)
            stmt = stmt.where(~Publication.category.in_(CATEGORIES))
        else:
            stmt = stmt.where(Publication.category == category)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(or_(
            Publication.title.ilike(pattern),
            Publication.description.ilike(pattern),
        ))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    if cursor:
        cursor_dt, cursor_id = decode_cursor(cursor)
        stmt = stmt.where(or_(
            Publication.created_at < cursor_dt,
            and_(Publication.created_at == cursor_dt, Publication.id < cursor_id),
        ))

    has_filters = bool(category or search or filter_by_user_id)
    if has_filters or cursor or not seed:
        stmt = stmt.order_by(Publication.created_at.desc(), Publication.id.desc())
    else:
        stmt = stmt.order_by(
            func.mod(func.extract("epoch", Publication.created_at) * seed, 999983).desc(),
            Publication.id.desc(),
        )

    stmt = stmt.limit(limit + 1)
    result = await db.execute(stmt)
    pubs = list(result.scalars().all())

    has_more = len(pubs) > limit
    if has_more:
        pubs = pubs[:limit]

    next_cursor = encode_cursor(pubs[-1].created_at, pubs[-1].id) if has_more and pubs else None
    upvoted_ids, comment_counts = await _batch_meta(db, pubs, user_id)
    items = [_pub_to_out(p, upvoted_ids, comment_counts) for p in pubs]
    return PaginatedPublications(items=items, next_cursor=next_cursor, total=total)


async def _ranked_query(
    db: AsyncSession,
    *,
    cursor: str | None,
    limit: int,
    category: str | None,
    search: str | None,
    user_id: uuid.UUID | None,
    filter_by_user_id: uuid.UUID | None = None,
) -> PaginatedPublications:
    from app.models.publication import Publication
    from app.models.comment import Comment

    cc_sub = (
        select(Comment.publication_id, func.count(Comment.id).label("cnt"))
        .group_by(Comment.publication_id)
        .subquery("cc")
    )
    score_expr = (Publication.upvote_count + func.coalesce(cc_sub.c.cnt, 0))

    def _base():
        q = (
            select(Publication, score_expr.label("score"))
            .outerjoin(cc_sub, Publication.id == cc_sub.c.publication_id)
            .options(selectinload(Publication.author))
        )
        if filter_by_user_id:
            q = q.where(Publication.user_id == filter_by_user_id)
        if category:
            if category == "__custom__":
                q = q.where(~Publication.category.in_(CATEGORIES))
            else:
                q = q.where(Publication.category == category)
        if search:
            pattern = f"%{search}%"
            q = q.where(or_(
                Publication.title.ilike(pattern),
                Publication.description.ilike(pattern),
            ))
        return q

    # Total count (without cursor)
    category_where = (
        ~Publication.category.in_(CATEGORIES) if category == "__custom__"
        else (Publication.category == category) if category
        else True
    )
    count_q = select(func.count()).select_from(
        select(Publication.id)
        .outerjoin(cc_sub, Publication.id == cc_sub.c.publication_id)
        .where(*([Publication.user_id == filter_by_user_id] if filter_by_user_id else [True]))
        .where(category_where)
        .subquery()
    )
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    stmt = _base()
    if cursor:
        cs, cursor_id = decode_score_cursor(cursor)
        stmt = stmt.where(or_(
            score_expr < cs,
            and_(score_expr == cs, Publication.id < cursor_id),
        ))

    stmt = stmt.order_by(score_expr.desc(), Publication.id.desc()).limit(limit + 1)
    rows = list((await db.execute(stmt)).all())

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    pubs = [row[0] for row in rows]
    scores = [int(row[1]) for row in rows]

    next_cursor = encode_score_cursor(scores[-1], pubs[-1].id) if has_more and pubs else None
    upvoted_ids, comment_counts = await _batch_meta(db, pubs, user_id)
    items = [_pub_to_out(p, upvoted_ids, comment_counts) for p in pubs]
    return PaginatedPublications(items=items, next_cursor=next_cursor, total=total)


# ── single publication ────────────────────────────────────────────────────────

async def get_publication_by_id(
    db: AsyncSession,
    pub_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
    *,
    rank_timezone: str = "UTC",
) -> PublicationOut | None:
    from app.models.publication import Publication
    from app.models.comment import Comment

    try:
        ZoneInfo(rank_timezone.strip() or "UTC")
        tz_name = rank_timezone.strip() or "UTC"
    except Exception:
        tz_name = "UTC"

    result = await db.execute(
        select(Publication)
        .options(selectinload(Publication.author))
        .where(Publication.id == pub_id)
    )
    pub = result.scalar_one_or_none()
    if not pub:
        return None

    upvoted_ids, comment_counts = await _batch_meta(db, [pub], user_id)
    current_score = pub.upvote_count + comment_counts.get(pub_id, 0)

    # Day rank in viewer timezone: same calendar day as this post, higher score first;
    # ties broken by higher id string (matches dashboard list sort).
    pub_local_date = pub.created_at.astimezone(ZoneInfo(tz_name)).date()

    cc_sub = (
        select(Comment.publication_id, func.count(Comment.id).label("cnt"))
        .group_by(Comment.publication_id)
        .subquery("cc_rank_day")
    )
    score_expr = Publication.upvote_count + func.coalesce(cc_sub.c.cnt, 0)
    same_calendar_day = func.date(
        func.timezone(bindparam("rank_tz"), Publication.created_at)
    ) == bindparam("pub_local_date")
    ahead_that_day = or_(
        score_expr > current_score,
        and_(score_expr == current_score, cast(Publication.id, Text) > bindparam("pub_id_text")),
    )
    rank_stmt = (
        select(func.count(Publication.id))
        .select_from(Publication)
        .outerjoin(cc_sub, Publication.id == cc_sub.c.publication_id)
        .where(same_calendar_day, ahead_that_day)
    )
    rank_result = await db.execute(
        rank_stmt,
        {
            "rank_tz": tz_name,
            "pub_local_date": pub_local_date,
            "pub_id_text": str(pub.id),
        },
    )
    rank = rank_result.scalar_one() + 1

    return _pub_to_out(pub, upvoted_ids, comment_counts, rank=rank)


# ── upvote ────────────────────────────────────────────────────────────────────

async def toggle_upvote(
    db: AsyncSession, user_id: uuid.UUID, publication_id: uuid.UUID
) -> UpvoteResponse:
    from app.models.publication import Publication
    from app.models.upvote import Upvote

    result = await db.execute(
        select(Upvote).where(
            and_(Upvote.user_id == user_id, Upvote.publication_id == publication_id)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.execute(delete(Upvote).where(
            and_(Upvote.user_id == user_id, Upvote.publication_id == publication_id)
        ))
        await db.execute(
            update(Publication).where(Publication.id == publication_id)
            .values(upvote_count=Publication.upvote_count - 1)
        )
        is_upvoted = False
    else:
        db.add(Upvote(user_id=user_id, publication_id=publication_id))
        await db.execute(
            update(Publication).where(Publication.id == publication_id)
            .values(upvote_count=Publication.upvote_count + 1)
        )
        is_upvoted = True

    await db.commit()
    pub_result = await db.execute(
        select(Publication.upvote_count).where(Publication.id == publication_id)
    )
    upvote_count = pub_result.scalar_one()
    return UpvoteResponse(upvote_count=upvote_count, is_upvoted=is_upvoted)
