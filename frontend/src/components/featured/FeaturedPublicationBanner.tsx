import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ArrowBigUp, Eye, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useActiveFeature } from "../../hooks/useFeatured";
import FeaturePublicationModal from "./FeaturePublicationModal";
import ContactSupportModal from "./ContactSupportModal";
import Avatar from "../ui/Avatar";
import { publicationPath } from "../../lib/publicationUrl";
import { trackFeaturedClick } from "../../lib/featuredUtm";
import { formatCategoryDisplay } from "../../constants/categories";

/** The card body — identical whether it holds a paid feature or the worked example,
 *  so an author sees exactly the listing they would be buying. */
interface CardContent {
  title: string;
  description?: string | null;
  category: string;
  image_url?: string | null;
  author_name?: string;
  author_tag?: string;
  author_avatar?: string | null;
  upvote_count: number;
  comment_count?: number;
}

function CardBody({
  pub,
  clickCount,
}: {
  pub: CardContent;
  clickCount?: number;
}) {
  return (
    <div className="flex gap-3 mt-2">
      <div className="flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg bg-white overflow-hidden border border-amber-200">
        {pub.image_url ? (
          <img
            src={pub.image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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
        <span className="text-[11px] font-medium text-gray-400">
          {formatCategoryDisplay(pub.category)}
        </span>
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
            <Avatar src={pub.author_avatar} name={pub.author_name} size={18} />
            <span className="text-xs text-gray-500 truncate">
              {pub.author_tag ? `@${pub.author_tag}` : pub.author_name}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
            <ArrowBigUp width={18} height={13} />
            {pub.upvote_count}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
            <MessageCircle size={12} />
            {pub.comment_count ?? 0}
          </span>
          {/* Shown from the first moment of the run, including at zero — a run with no
              visits yet is information, not a reason to hide the counter. */}
          {clickCount != null && (
            <span
              className="flex items-center gap-1 rounded-full border border-amber-200 bg-white/70
                         px-2 py-0.5 text-xs font-semibold text-amber-700"
              title="Visits BlogHub has sent to this publication during its featured run"
            >
              <Eye size={12} />
              {clickCount.toLocaleString()} visit{clickCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Static sample shown on the open slot so an author can see what they'd be buying.
 *
 * Blog2Video is our own product, so showcasing it here makes no claim about anyone
 * else. The numbers are illustrative of a healthy listing, not a promise about what
 * the slot delivers — the real card only ever shows counts a booking actually earned.
 */
const EXAMPLE_PUBLICATION = {
  title: "Blog2Video — turn any blog post into a video in minutes",
  description:
    "Paste a URL and get a narrated, captioned video ready for YouTube, Shorts and LinkedIn. Reach a 4x wider audience from writing you have already published.",
  category: "Tech",
  image_url: "/assets/landing/image.png" as string | null,
  author_name: "Blog2Video",
  author_tag: "blog2video",
  upvote_count: 128,
  comment_count: 24,
  click_count: 1460,
};

/** FAQ / support links, sat above the card and right-aligned. */
function HelpLinks({ onContact }: { onContact: () => void }) {
  const linkClass =
    "text-xs text-gray-500 underline underline-offset-2 transition-colors hover:text-amber-700";
  return (
    <div className="flex justify-end items-center gap-4 mb-1.5">
      <Link to="/featured-faq" className={linkClass}>
        FAQs
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

/** The paid featured publication, or — when the slot is open — the same card showing
 *  Blog2Video's real listing as a worked example of what the slot looks like.
 *
 * While the slot is still loading we render nothing rather than flashing the CTA at
 * someone who is about to see a real feature.
 */
export default function FeaturedPublicationBanner({ className = "" }: { className?: string }) {
  const { user, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useActiveFeature();
  const [featuring, setFeaturing] = useState(false);
  const [contacting, setContacting] = useState(false);
  const slotIsOpen = !isLoading && !isError && !data;

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
          <div className="flex items-center justify-between gap-3">
            <span className={PILL_CLASSES}>Featured</span>
            <span className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-medium text-amber-700/70">
                Example listing
              </span>
              <span
                className="flex-shrink-0 rounded-full border border-amber-400 bg-amber-500 px-3 py-1
                           text-xs font-semibold text-white transition-colors group-hover:bg-amber-600"
              >
                Get featured — $30
              </span>
            </span>
          </div>

          <CardBody pub={EXAMPLE_PUBLICATION} clickCount={EXAMPLE_PUBLICATION.click_count} />
        </button>

        <FeaturePublicationModal isOpen={featuring} onClose={() => setFeaturing(false)} />
        <ContactSupportModal isOpen={contacting} onClose={() => setContacting(false)} />
      </div>
    );
  }

  const pub = data!.publication;

  const activate = () => {
    if (!user) {
      openLoginModal();
      return; // a login prompt is not a visit — don't count it
    }
    // This is the traffic the buyer paid for: someone clicking the featured card.
    // Fire-and-forget, so it can never delay or block the navigation.
    trackFeaturedClick(pub.id, true);
    navigate(publicationPath(pub));
  };

  return (
    <div className={className}>
      <HelpLinks onContact={() => setContacting(true)} />

      <article
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate();
          }
        }}
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
            author_name: pub.author?.name,
            author_tag: pub.author?.tag,
            author_avatar: pub.author?.avatar_url,
            upvote_count: pub.upvote_count,
            comment_count: pub.comment_count,
          }}
          clickCount={data!.click_count}
        />
      </article>

      <FeaturePublicationModal isOpen={featuring} onClose={() => setFeaturing(false)} />
      <ContactSupportModal isOpen={contacting} onClose={() => setContacting(false)} />
    </div>
  );
}
