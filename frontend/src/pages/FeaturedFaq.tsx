import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Check, Globe, Mail, MousePointerClick } from "lucide-react";
import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import Button from "../components/ui/Button";
import FeaturedReach from "../components/featured/FeaturedReach";
import { useAuth } from "../context/AuthContext";
import {
  type FeatureDuration,
  POST_LOGIN_PATH_KEY,
  estimatedClicksLabel,
  featureDashboardPath,
} from "../lib/featuredCheckout";
import { LEGAL } from "../constants/legal";

type Section = "pricing" | "faqs";

const linkClass =
  "text-base sm:text-lg font-semibold text-red-600 underline underline-offset-2 transition-colors hover:text-red-700";

function SectionLinks({
  section,
  onSection,
}: {
  section: Section;
  onSection: (s: Section) => void;
}) {
  const other: Section = section === "pricing" ? "faqs" : "pricing";
  const label = other === "pricing" ? "Pricing" : "FAQs";

  return (
    <div className="flex items-center sm:flex-shrink-0">
      <button type="button" onClick={() => onSection(other)} className={linkClass}>
        {label}
      </button>
    </div>
  );
}

const PACKAGES = [
  {
    durationDays: 7 as FeatureDuration,
    name: "7 days",
    price: "$30",
    label: "Launch week",
    description: "A focused run for a new post, product update, or announcement.",
    advantages: [
      "Top placement on the home page and dashboard",
      "No competing publication in the featured slot",
      "Featured card stays live for one full week",
      "Announcement email drafted for your approval",
      "You choose when the email is sent",
      "Clicks and unique impressions in your analytics",
      "UTM-tagged outbound links during the run",
      "Good fit for launches, new posts, and short campaigns",
    ],
  },
  {
    durationDays: 14 as FeatureDuration,
    name: "14 days",
    price: "$60",
    label: "Campaign",
    description: "More time for readers to see the feature across multiple visits.",
    advantages: [
      "Prominent placement in main discovery pages",
      "Your publication is the only featured listing",
      "Two full weeks in the featured card",
      "Editable subscriber announcement email included",
      "You choose the email send time",
      "UTM-tagged traffic for your own analytics",
      "More time to catch repeat dashboard visitors",
      "Better runway for newsletter and social promotion",
    ],
  },
  {
    durationDays: 30 as FeatureDuration,
    name: "30 days",
    price: "$80",
    label: "Best value",
    description: "The longest run, best for ongoing launches or evergreen pages.",
    advantages: [
      "Month-long visibility on home and dashboard",
      "Exclusive ownership of the featured position",
      "Best daily price of the three packages",
      "Editable subscriber announcement email included",
      "You choose the email send time",
      "Run-level clicks and unique impression tracking",
      "Best fit for evergreen pages and ongoing launches",
      "Longer visibility window across visitor habits",
    ],
  },
] as const;

function PricingContent() {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();

  const startPackage = (durationDays: FeatureDuration) => {
    const path = featureDashboardPath(durationDays);
    if (user) {
      navigate(path);
      return;
    }
    try {
      sessionStorage.setItem(POST_LOGIN_PATH_KEY, path);
    } catch {
      /* private mode */
    }
    openLoginModal();
  };

  return (
    <div className="flex flex-col gap-8">
      <FeaturedReach />

      <section>
        <div className="grid gap-4 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{pkg.name}</h3>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  {pkg.label}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{pkg.price}</p>
              <p className="mt-2 min-h-[48px] text-sm text-gray-500">{pkg.description}</p>

              {/* Per-package, because "50–80 clicks a week" means something different
                  for a 7-day run than for a 30-day one. */}
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50/60 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">
                  Estimated reach
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <MousePointerClick size={14} className="flex-shrink-0 text-red-600" />
                  {estimatedClicksLabel(pkg.durationDays)} clicks to your site
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Globe size={12} className="flex-shrink-0 text-gray-400" />
                  70% US, 20% other developed countries
                </p>
              </div>

              <ul className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
                {pkg.advantages.map((advantage) => (
                  <li key={advantage} className="flex gap-2 text-sm text-gray-600">
                    <Check size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                    <span>{advantage}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="primary"
                size="sm"
                className="mt-4 w-full justify-center"
                onClick={() => startPackage(pkg.durationDays)}
              >
                Get started
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Click ranges scale our last advertiser&apos;s 50–80 clicks in a week to the length of each
          run. They&apos;re estimates from past traffic, not a guaranteed number of clicks — what
          your listing earns depends on your title, description, and cover image.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Mail size={16} className="text-red-600" />
            Marketing email included
          </div>
          <p className="mt-2 text-sm text-gray-600">
            We draft a subscriber announcement during checkout. You edit the subject, body,
            button text, and send time before paying; completing payment finalises your copy.
            Nothing goes out until we approve it.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <BarChart3 size={16} className="text-red-600" />
            Run-level analytics
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Your profile shows clicks and unique impressions for each featured run. Outbound links
            are also tagged with BlogHub featured UTM parameters for your own analytics.
          </p>
        </div>
      </section>

      <p className="text-sm text-gray-500">
        One payment, no subscription, no auto-renewal. Payment is handled by Stripe, and you can
        enter a promotion code on the Stripe checkout page.
      </p>
    </div>
  );
}

function FaqContent() {
  return (
    <>
      <LegalSection title="What is it?">
        <p>
          One paid slot at the top of {LEGAL.siteName}. Your publication sits in a highlighted card
          on the home page and the dashboard, above everything else.
        </p>
        <p>
          Only one publication is featured at a time. You&apos;re not sharing the space, and we take
          your publication out of the list underneath so it isn&apos;t shown twice.
        </p>
      </LegalSection>

      <LegalSection title="How much traffic does it get?">
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
        <p>
          These are past figures for the site, not a guaranteed number of clicks for your run. What
          your listing earns depends on your title, description, and cover image.
        </p>
      </LegalSection>

      <LegalSection title="What does it cost?">
        <p>
          $30 for 7 days, $60 for 14 days, or $80 for 30 days. One payment, no subscription,
          nothing renews. When your run is up the slot opens again.
        </p>
        <p>
          If you have a promotion code, there&apos;s a field for it on the Stripe checkout page.
        </p>
      </LegalSection>

      <LegalSection title="How do I book?">
        <p>
          Hit <strong>Get featured</strong> on the card at the top of the home page or dashboard, or
          go to your profile and click <strong>Feature your publication</strong>.
        </p>
        <p>
          Pick a start date, pick which of your publications to feature, and pay through Stripe. Days
          someone else has already booked are greyed out. So are start dates that would run into a
          booked week, since a run has to fit into free days end to end.
        </p>
        <p>Payment is handled by Stripe. We never see your card details.</p>
      </LegalSection>

      <LegalSection title="Can someone take my dates while I'm paying?">
        <p>
          No. Your dates are held for 30 minutes the moment you start checkout, and nobody else can
          book them in that window. Walk away without paying and the hold lapses.
        </p>
      </LegalSection>

      <LegalSection title="How far ahead can I book?">
        <p>Up to 180 days. The calendar shows what&apos;s free, so you can line a run up with a launch.</p>
      </LegalSection>

      <LegalSection title="When does it go live?">
        <p>
          We review every booking before it goes on the site. Paying reserves your dates; it
          doesn&apos;t publish the listing. We&apos;re usually quick about it, and you&apos;ll get an
          email when it&apos;s approved.
        </p>
        <p>
          After that it goes live on your start date, or right away if your run has already started.
          It comes down on its own when the last day is over.
        </p>
        <p>If we can&apos;t approve a booking, you get your dates back and your money back.</p>
      </LegalSection>

      <LegalSection title="The announcement email">
        <p>
          The booking flow has an announcement step before you pay. We draft a short email about
          your publication for {LEGAL.siteName} subscribers. You can rewrite the subject, message,
          and button text, and choose when it should send — any day within your featured run.
        </p>
        <p>
          When you complete payment, that version is saved and finalised from your side. You can
          still open it from the envelope on your publication&apos;s card in your profile, but it
          is read-only after checkout.
        </p>
        <p>
          Our team approves your booking and the email. Nothing goes out until both are approved.
          It then sends at the time you picked during checkout.
        </p>
      </LegalSection>

      <LegalSection title="What do I actually get?">
        <p>
          Your title, description, cover image and byline in front of everyone who lands on{" "}
          {LEGAL.siteName}, signed in or not.
        </p>
        <p>
          You also get run-level analytics: unique impressions for people who saw the featured card,
          and clicks on the featured card while your publication is live in the slot.
        </p>
        <p>
          While you&apos;re featured we also tag the links on your publication page with{" "}
          <code>utm_source=bloghub</code> and <code>utm_campaign=featured</code>, so the traffic
          shows up in your own analytics.
        </p>
      </LegalSection>

      <LegalSection title="Can I book more than one run?">
        <p>
          Yes. Book as many as you want, for any publications you own. Each run features one
          publication, and runs can&apos;t overlap, because only one publication is featured at a
          time.
        </p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>
          If your run hasn&apos;t started, or something has gone wrong with a booking, email us and
          we&apos;ll sort it out.
        </p>
      </LegalSection>

      <LegalSection title="Anything else">
        <p>
          Email{" "}
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="text-red-600 underline hover:text-red-700"
          >
            {LEGAL.contactEmail}
          </a>
          , or use the <strong>Contact support</strong> link above the featured card.
        </p>
      </LegalSection>
    </>
  );
}

export default function FeaturedFaq() {
  const [section, setSection] = useState<Section>("pricing");

  return (
    <LegalPageLayout
      title="Featured Publication"
      description={`How the paid featured slot works on ${LEGAL.siteName} — pricing, scheduling, availability, and what you get.`}
      canonicalPath="/featured-faq"
      showLastUpdated={false}
      headerRight={<SectionLinks section={section} onSection={setSection} />}
    >
      <h2 className="text-lg font-semibold text-gray-900">
        {section === "pricing" ? "Pricing" : "FAQs"}
      </h2>

      {section === "pricing" ? <PricingContent /> : <FaqContent />}
    </LegalPageLayout>
  );
}
