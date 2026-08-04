import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useActiveFeature } from "../../hooks/useFeatured";
import FeaturePublicationModal from "./FeaturePublicationModal";
import ContactSupportModal from "./ContactSupportModal";
import CommentsModal from "../publication/CommentsModal";
import UpvoteButton from "../publication/UpvoteButton";
import Avatar from "../ui/Avatar";
import { outboundUrl, trackFeaturedClick, trackFeaturedImpression } from "../../lib/featuredUtm";
import { formatCategoryDisplay } from "../../constants/categories";
import { publicationPath } from "../../lib/publicationUrl";
import CropImage from "../ui/CropImage";
import { LEGAL } from "../../constants/legal";

/** The card body of a live paid feature. */
interface CardContent {
  title: string;
  description?: string | null;
  category: string;
  image_url?: string | null;
  image_position?: string | null;
  image_scale?: number | null;
  author_name?: string;
  author_tag?: string;
  author_avatar?: string | null;
  author_avatar_position?: string | null;
  author_avatar_scale?: number | null;
  upvote_count: number;
  comment_count?: number;
}

function CardBody({ pub }: { pub: CardContent }) {
  return (
    <div className="flex gap-3 mt-2">
      <div
        className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white overflow-hidden border border-amber-200"
      >
        {pub.image_url ? (
          <CropImage
            src={pub.image_url}
            position={pub.image_position}
            scale={pub.image_scale}
            className="w-full h-full transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-50">
            <svg className="w-6 h-6 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-1">
          {pub.title}
        </h3>
        {pub.description && (
          <p className="text-xs sm:text-sm text-gray-600 leading-snug line-clamp-2">
            {pub.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto pt-0.5">
          <span className="flex items-center gap-1.5 min-w-0">
            <Avatar src={pub.author_avatar} name={pub.author_name} position={pub.author_avatar_position} scale={pub.author_avatar_scale} size={18} />
            <span className="text-xs text-gray-500 truncate">
              {pub.author_tag ? `@${pub.author_tag}` : pub.author_name}
            </span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] font-medium text-gray-400">
            {formatCategoryDisplay(pub.category)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The open slot: the invitation itself, in the shape of the card it would fill.
 *
 * No sample publication and no sample counts — an invented listing with invented
 * engagement numbers reads as a real feature, and as a promise about what the slot
 * delivers. What's left is the offer, which we can stand behind.
 */
function OpenSlotBody() {
  return (
    <div className="flex gap-3 mt-2">
      <div
        className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white overflow-hidden
                   border border-amber-200 flex items-center justify-center"
      >
        <span
          className="text-4xl sm:text-5xl font-bold text-gray-700"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          F
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
          Your publication here
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-snug">
          The only featured listing at the top of the home page and dashboard, plus an
          announcement email to {LEGAL.siteName} subscribers.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto pt-0.5">
          <span className="text-[11px] font-semibold text-amber-700">From $30 for 7 days</span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] font-medium text-gray-400">~3,000 visitors so far</span>
        </div>
      </div>
    </div>
  );
}

/** FAQ / support links, sat above the card and right-aligned. */
function HelpLinks({ onContact }: { onContact: () => void }) {
  const linkClass =
    "text-xs text-gray-500 underline underline-offset-2 transition-colors hover:text-amber-700";
  return (
    <div className="flex justify-end items-center gap-4 mb-1.5">
      <Link to="/featured-faq" className={linkClass}>
        Learn more
      </Link>
      <button type="button" onClick={onContact} className={linkClass}>
        Contact support
      </button>
    </div>
  );
}

const CARD_CLASSES = `group relative w-full text-left rounded-2xl border
  bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-3 transition-all
  hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10`;

const PILL_CLASSES = `inline-flex items-center rounded-full bg-gradient-to-r from-amber-500
  to-yellow-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm`;

interface FeaturedPublicationBannerProps {
  className?: string;
  /** Which page this card is rendered on — kept distinct in the outbound UTM tag
   *  (`utm_content=landing_card` vs `dashboard_card`) so the buyer's own analytics
   *  can tell which surface actually sent the click, not just that BlogHub did. */
  surface: "landing" | "dashboard";
}

/** The paid featured publication, or — when the slot is open — the same card carrying
 *  the invitation to buy it.
 *
 * While the slot is still loading we render nothing rather than flashing the CTA at
 * someone who is about to see a real feature.
 */
export default function FeaturedPublicationBanner({
  className = "",
  surface,
}: FeaturedPublicationBannerProps) {
  const { user, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useActiveFeature();
  const [featuring, setFeaturing] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const slotIsOpen = !isLoading && !isError && !data;

  useEffect(() => {
    if (!data) return;
    const el = articleRef.current;
    if (!el) return;

    let tracked = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (tracked || !entry.isIntersecting) return;
        tracked = true;
        trackFeaturedImpression(data.publication.id, data.slot_id);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  // An errored lookup is not the same as an empty slot: inviting someone to buy a
  // slot we couldn't read is worse than showing nothing.
  if (isLoading || isError) return null;

  const openBooking = () => {
    if (user) setFeaturing(true);
    else openLoginModal();
  };

  if (slotIsOpen) {
    return (
      <div className={className}>
        <HelpLinks onContact={() => setContacting(true)} />

        <button
          type="button"
          onClick={openBooking}
          className={`${CARD_CLASSES} border-dashed border-amber-300`}
        >
          {/* "Featured" would claim a booking that doesn't exist while the slot is
              open, so the pill carries the invitation instead — and is the only CTA
              here, since the whole card is already the button. */}
          <div className="flex items-center justify-between gap-3">
            <span className={PILL_CLASSES}>Get featured</span>
            <span className="text-[11px] font-medium text-amber-700/70">Open slot</span>
          </div>

          <OpenSlotBody />
        </button>

        <FeaturePublicationModal isOpen={featuring} onClose={() => setFeaturing(false)} />
        <ContactSupportModal isOpen={contacting} onClose={() => setContacting(false)} />
      </div>
    );
  }

  const pub = data!.publication;
  // Distinct per page, so the buyer's analytics can tell landing traffic from
  // dashboard traffic rather than lumping every card click into one bucket.
  const utmContent = surface === "landing" ? "landing_card" : "dashboard_card";

  const activate = () => {
    // This is the traffic the buyer paid for: someone clicking the featured card.
    // Fire-and-forget, so it can never delay or block the navigation.
    trackFeaturedClick(pub.id, true);
    window.location.href = outboundUrl(pub.url, utmContent, true);
  };

  const openDetails = (e: MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    navigate(publicationPath(pub));
  };

  const openComments = (e: MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    setCommentsOpen(true);
  };

  return (
    <div className={className}>
      <HelpLinks onContact={() => setContacting(true)} />

      <article
        ref={articleRef}
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate();
          }
        }}
        title={`Visit ${pub.title} (opens the publication's own site)`}
        className={`${CARD_CLASSES} border-amber-300 cursor-pointer`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={PILL_CLASSES}>Featured</span>

          {/* Lets any visitor buy the next slot. Stop the click bubbling to the card,
              which would otherwise navigate to the featured publication instead. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openBooking();
            }}
            className="flex-shrink-0 rounded-full border border-amber-300 bg-white/80 px-3 py-1
                       text-xs font-semibold text-amber-700 transition-colors
                       hover:border-amber-500 hover:bg-white hover:text-amber-800"
          >
            Get featured
          </button>
        </div>

        <CardBody
          pub={{
            title: pub.title,
            description: pub.description,
            category: pub.category,
            image_url: pub.image_url,
            image_position: pub.image_position,
            image_scale: pub.image_scale,
            author_name: pub.author?.name,
            author_tag: pub.author?.tag,
            author_avatar: pub.author?.avatar_url,
            author_avatar_position: pub.author?.avatar_position,
            author_avatar_scale: pub.author?.avatar_scale,
            upvote_count: pub.upvote_count,
            comment_count: pub.comment_count,
          }}
        />

        {/* Distinct from the card click above: these act on the publication inside
            BlogHub (its detail page, its comments, its upvote), so each one stops
            the click reaching the card and sending the visitor off-site instead.
            Left-padded to line up under the title/description text rather than the
            thumbnail (image width + the gap-3 from the row above). */}
        <div
          className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-100/80
                      pl-[76px] sm:pl-[92px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={openComments}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                       bg-white/80 text-gray-600 border border-amber-200 transition-colors
                       hover:border-amber-400 hover:bg-white hover:text-amber-700"
          >
            <MessageCircle size={13} />
            {pub.comment_count ?? 0}
          </button>
          <UpvoteButton
            publicationId={pub.id}
            count={pub.upvote_count}
            isUpvoted={pub.is_upvoted}
            queryKey={["featured", "active"]}
          />
          {!pub.is_unlisted && (
            <button
              type="button"
              onClick={openDetails}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-700
                         underline underline-offset-2 transition-colors hover:text-amber-800"
            >
              Details
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </article>

      <FeaturePublicationModal isOpen={featuring} onClose={() => setFeaturing(false)} />
      <CommentsModal isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} publication={pub} />
      <ContactSupportModal isOpen={contacting} onClose={() => setContacting(false)} />
    </div>
  );
}
