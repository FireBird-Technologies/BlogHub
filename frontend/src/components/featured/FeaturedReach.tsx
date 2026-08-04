import { Globe, MousePointerClick, Users } from "lucide-react";
import { LEGAL } from "../../constants/legal";
import { estimatedClicksLabel } from "../../lib/featuredCheckout";

/** What the slot actually reaches — the first thing a buyer wants to know, so it
 *  appears both on the Get Featured page and inside the booking modal.
 *
 * Kept in one place because it is a set of factual claims about the site: two copies
 * would eventually disagree about the numbers, and the wrong one would be the one a
 * buyer read before paying.
 */
interface FeaturedReachProps {
  /** `page` is the full panel on the Get Featured page; `compact` is the tighter
   *  version that fits inside the booking modal. */
  variant?: "page" | "compact";
  /** When set, the click figure is the estimate for a run of this length instead of
   *  the flat weekly number — so the panel answers "what do I get for *this* run?". */
  durationDays?: number;
}

export default function FeaturedReach({ variant = "page", durationDays }: FeaturedReachProps) {
  const compact = variant === "compact";

  const stats = durationDays
    ? [
        {
          icon: MousePointerClick,
          value: estimatedClicksLabel(durationDays),
          label: `estimated clicks over ${durationDays} days`,
        },
        { icon: Users, value: "~3,000", label: "visitors so far" },
        { icon: Globe, value: "70% US", label: "plus 20% other developed countries" },
      ]
    : [
        { icon: Users, value: "~3,000", label: "visitors so far" },
        {
          icon: MousePointerClick,
          value: "50–80",
          label: "clicks in a week for our last advertiser",
        },
        { icon: Globe, value: "70% US", label: "plus 20% other developed countries" },
      ];

  return (
    <section
      className={`rounded-2xl border border-red-100 bg-red-50/50 ${compact ? "p-3" : "p-4 sm:p-5"}`}
    >
      <h3 className={`font-semibold text-gray-900 ${compact ? "text-xs" : "text-sm"}`}>
        What the slot reaches
      </h3>

      <div className={`grid gap-2 sm:grid-cols-3 ${compact ? "mt-2.5" : "mt-4 sm:gap-3"}`}>
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className={`rounded-xl border border-red-100 bg-white ${compact ? "p-2.5" : "p-3"}`}
          >
            <Icon size={compact ? 14 : 16} className="text-red-600" />
            <p
              className={`mt-1.5 font-bold tracking-tight text-gray-900 ${
                compact ? "text-base" : "text-xl mt-2"
              }`}
            >
              {value}
            </p>
            <p className={`mt-0.5 text-gray-500 ${compact ? "text-[11px]" : "text-xs"}`}>{label}</p>
          </div>
        ))}
      </div>

      <div
        className={`flex flex-col text-gray-600 ${compact ? "mt-2.5 gap-2 text-xs" : "mt-4 gap-3 text-sm"}`}
      >
        <p>
          {LEGAL.siteName} has seen around 3,000 visitors so far. Our last featured advertiser
          averaged 50 to 80 clicks in a single week, directly to their site.
        </p>
        <p>
          At $30 per week, that works out to a fraction of what you&apos;d pay for the same volume
          on Meta or Google Ads, without the bidding wars or targeting overhead.
        </p>
        <p>
          Our traffic is roughly 70% US and another 20% from other developed countries, so
          you&apos;re reaching readers with real purchasing power and a habit of subscribing to
          content they like.
        </p>
        {durationDays && (
          <p className={compact ? "text-[11px] text-gray-500" : "text-xs text-gray-500"}>
            The click figure scales that advertiser&apos;s week to {durationDays} days. It&apos;s an
            estimate, not a guaranteed number of clicks.
          </p>
        )}
      </div>
    </section>
  );
}
