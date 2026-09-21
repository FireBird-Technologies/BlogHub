import { Globe, MousePointerClick, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { LEGAL } from "../../constants/legal";
import {
  ESTIMATE_DISCLAIMER,
  FEATURED_REFUND_POLICY_PATH,
  estimatedClicksLabel,
} from "../../lib/featuredCheckout";

/** What the slot actually reaches — the first thing a buyer wants to know, so it
 *  appears both on the Get Featured page and inside the booking modal.
 *
 * Kept in one place because it is a set of factual claims about the site: two copies
 * would eventually disagree about the numbers, and the wrong one would be the one a
 * buyer read before paying.
 */
interface FeaturedReachProps {
  /** `page` is the full panel on the Get Featured page; `compact` is the slim strip
   *  that fits inside the booking modal. */
  variant?: "page" | "compact";
  /** When set, the click figure is the estimate for a run of this length instead of
   *  the flat weekly number — so the panel answers "what do I get for *this* run?". */
  durationDays?: number;
}

export default function FeaturedReach({ variant = "page", durationDays }: FeaturedReachProps) {
  // Inside the booking modal the buyer has already decided and is picking dates, so
  // this is a single slim strip: three numbers and the estimate caveat, nothing else.
  if (variant === "compact") {
    const tiles = [
      {
        value: durationDays ? estimatedClicksLabel(durationDays) : "50–80",
        label: durationDays ? `est. clicks / ${durationDays} days*` : "est. clicks / week*",
      },
      { value: "~5,000", label: "visitors since launch" },
      { value: "70% US", label: "+20% other developed" },
    ];
    return (
      <section className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2">
        <div className="grid grid-cols-3 divide-x divide-red-100 text-center">
          {tiles.map(({ value, label }) => (
            <div key={label} className="px-1">
              <p className="text-sm font-bold tracking-tight text-gray-900">{value}</p>
              <p className="text-[10px] leading-tight text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-500">
          *{ESTIMATE_DISCLAIMER.slice(1, -1)}.
        </p>
      </section>
    );
  }

  const stats = durationDays
    ? [
        {
          icon: MousePointerClick,
          value: estimatedClicksLabel(durationDays),
          label: `estimated clicks over ${durationDays} days ${ESTIMATE_DISCLAIMER}`,
        },
        { icon: Users, value: "~5,000", label: "total visitors since launch" },
        { icon: Globe, value: "70% US", label: "plus 20% other developed countries" },
      ]
    : [
        { icon: Users, value: "~5,000", label: "total visitors since launch" },
        {
          icon: MousePointerClick,
          value: "50–80",
          label: `estimated clicks per week, from past features ${ESTIMATE_DISCLAIMER}`,
        },
        { icon: Globe, value: "70% US", label: "plus 20% other developed countries" },
      ];

  return (
    <section className="rounded-2xl border border-red-100 bg-red-50/50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-900">What the slot reaches</h3>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-xl border border-red-100 bg-white p-3">
            <Icon size={16} className="text-red-600" />
            <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600">
        <p>
          {LEGAL.siteName} has had around 5,000 visitors in total since launch. That&apos;s a
          cumulative count, not a monthly figure. Based on past features, a featured listing gets
          around 50 to 80 clicks to its site in a week {ESTIMATE_DISCLAIMER}.
        </p>
        <p>
          Our traffic is roughly 70% US and another 20% from other developed countries, so
          you&apos;re reaching readers with real purchasing power and a habit of subscribing to
          content they like.
        </p>
        <p className="text-xs text-gray-500">
          These are estimates from past features, not a prediction for your run. What your listing
          earns depends on your title, description and cover image, and we don&apos;t refund runs
          that get fewer clicks than estimated. See the{" "}
          <Link to={FEATURED_REFUND_POLICY_PATH} className="text-red-600 underline hover:text-red-700">
            refund policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
