import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import { LEGAL } from "../constants/legal";

export default function FeaturedFaq() {
  return (
    <LegalPageLayout
      title="Featured Publication FAQ"
      description={`How the paid featured slot works on ${LEGAL.siteName} — pricing, scheduling, availability, and what you get.`}
      canonicalPath="/featured-faq"
    >
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

      <LegalSection title="What does it cost?">
        <p>
          $30 for 7 days. One payment, no subscription, nothing renews. When your week is up the
          slot opens again.
        </p>
      </LegalSection>

      <LegalSection title="How do I book?">
        <p>
          Hit <strong>Get featured</strong> on the card at the top of the home page or dashboard, or
          go to your profile and click <strong>Feature a publication</strong>.
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
          When you pay, we write a short email about your publication to send to {LEGAL.siteName}{" "}
          subscribers. Open it from the envelope on your publication&apos;s card in your profile.
          Read it, rewrite as much of it as you like.
        </p>
        <p>
          When it says what you want it to say, <strong>finalise</strong> it. That locks the wording
          and hands it to us. Nothing goes out before you do that.
        </p>
        <p>
          We approve it, then it sends 24 hours after your publication actually goes live. Not 24
          hours after approval. Book a run for next month and the email lands the day after that run
          starts, when there&apos;s something for people to click on.
        </p>
      </LegalSection>

      <LegalSection title="What do I actually get?">
        <p>
          Your title, description, cover image and byline in front of everyone who lands on{" "}
          {LEGAL.siteName}, signed in or not.
        </p>
        <p>
          You also get a count. Every click on your featured card is recorded and shown live on the
          card. That&apos;s clicks on the card only, not clicks on your links once someone is already
          reading your page. Those would have happened anyway, and mixing them in would tell you
          nothing about the slot.
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
    </LegalPageLayout>
  );
}
