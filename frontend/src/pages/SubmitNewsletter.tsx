import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Globe, Link2, Search, Sparkles, Users } from "lucide-react";
import LandingNavbar from "../components/landing/LandingNavbar";
import Footer from "../components/landing/Footer";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { submitNewsletterSchema } from "../seo/schema";
import { SUBMIT_NEWSLETTER } from "../content/submitNewsletter";
import { LEGAL } from "../constants/legal";

const STEP_ICONS = [Link2, Sparkles, Users] as const;

/**
 * Keyword landing page for the transactional half of BlogHub's audience: writers
 * searching "submit newsletter" / "newsletter directory" / "newsletter aggregator"
 * rather than "how do I grow a newsletter".
 *
 * The copy lives in content/submitNewsletter.ts so the FAQ can be rendered on the
 * page and emitted as FAQPage JSON-LD from a single source.
 */
export default function SubmitNewsletter() {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();

  useDocumentMeta({
    title: SUBMIT_NEWSLETTER.metaTitle,
    description: SUBMIT_NEWSLETTER.metaDescription,
    canonicalUrl: `${LEGAL.siteUrl}${SUBMIT_NEWSLETTER.path}`,
    type: "website",
  });
  useJsonLd(submitNewsletterSchema());

  const submit = () => {
    if (user) {
      navigate("/dashboard");
      return;
    }
    openLoginModal();
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />

      <div className="flex-1">
        {/* Hero — carries the H1 the page is built to rank for. */}
        <section className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              <Sparkles size={13} />
              Free — no listing fee, ever
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.15] tracking-tight text-gray-900">
              Submit your newsletter to the
              <br />
              <span className="text-red-600">BlogHub directory</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
              {LEGAL.siteName} is a free newsletter and blog directory where readers browse
              publications by category and upvote the ones worth subscribing to. Add yours in about a
              minute — paste a URL, pick a category, publish. You get discovery traffic, a permanent
              listing page, and a do-follow link back to your site.
            </p>

            <div className="flex flex-col items-center gap-3 mt-4">
              <Button variant="primary" size="lg" onClick={submit}>
                Submit your newsletter — free
              </Button>
              <p className="text-xs text-gray-400">
                Works for Substack, beehiiv, Ghost, Kit, Medium, and self-hosted blogs.
              </p>
            </div>
          </div>
        </section>

        {/* What a listing gets you. */}
        <section className="px-4 sm:px-6 py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center">
              What your listing gets you
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {SUBMIT_NEWSLETTER.benefits.map((benefit) => (
                <article
                  key={benefit.title}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How submission works. */}
        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center">
              How to submit your newsletter
            </h2>
            <p className="mt-3 text-center text-gray-500">
              Three steps, no application form, no waiting list.
            </p>

            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {SUBMIT_NEWSLETTER.steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? Link2;
                return (
                  <li key={step.title} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <Icon size={17} className="text-red-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 flex justify-center">
              <Button variant="primary" size="md" onClick={submit}>
                Add your publication
              </Button>
            </div>
          </div>
        </section>

        {/* Who it's for — the platform long tail, in prose Google can read. */}
        <section className="px-4 sm:px-6 py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Every newsletter platform is welcome
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              {LEGAL.siteName} is platform-agnostic. It doesn&apos;t matter where you publish or how
              big your list is — a directory listing is one of the few growth channels that works the
              same on day one as it does at ten thousand subscribers.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {SUBMIT_NEWSLETTER.platforms.map((platform) => (
                <li key={platform} className="flex gap-2 text-sm text-gray-700">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <span>{platform}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Discovery angle — targets the reader-side queries that also land here. */}
        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Search size={16} className="text-red-600" />
                Readers actually browse here
              </div>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                A directory only sends traffic if people use it to find things. {LEGAL.siteName} is
                built around browsing: publications are sorted into categories, ranked by community
                upvotes, and surfaced on the home page as they&apos;re added. Readers looking for
                something new in your category will run into your listing.
              </p>
              <Link
                to="/dashboard"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Browse the directory
                <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Globe size={16} className="text-red-600" />
                A link that keeps working
              </div>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Your listing gets its own indexable page on {LEGAL.siteName} with your title,
                description, and a link to your publication. Unlike a social post that dies in a day,
                that page stays up, gets crawled, and keeps sending the occasional reader for as long
                as it&apos;s live.
              </p>
              <Link
                to="/blogs/best-newsletter-directories"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                See the full list of newsletter directories
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ — rendered and emitted as FAQPage JSON-LD from the same source. */}
        <section className="px-4 sm:px-6 py-12 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Questions about submitting
            </h2>
            <div className="mt-8 flex flex-col gap-7">
              {SUBMIT_NEWSLETTER.faq.map((item) => (
                <div key={item.question}>
                  <h3 className="text-base font-semibold text-gray-900">{item.question}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA + internal links into the newsletter blog cluster. */}
        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Ready to get your newsletter in front of readers?
            </h2>
            <p className="mt-3 text-gray-500">
              Listing is free and takes about a minute.
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={submit}>
                Submit your newsletter
              </Button>
            </div>

            <div className="mt-12 border-t border-gray-200 pt-8 text-left">
              <p className="text-sm font-semibold text-gray-900">Keep reading</p>
              <ul className="mt-3 flex flex-col gap-2">
                {SUBMIT_NEWSLETTER.relatedPosts.map((post) => (
                  <li key={post.path}>
                    <Link
                      to={post.path}
                      className="text-sm text-red-600 hover:text-red-700 hover:underline"
                    >
                      {post.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
