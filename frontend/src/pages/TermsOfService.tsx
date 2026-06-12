import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import { LEGAL } from "../constants/legal";

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description={`Terms of Service for ${LEGAL.siteName} — rules for using our publication discovery and sharing platform.`}
      canonicalPath="/terms"
      crossLink={{ label: "Privacy Policy", to: "/privacy" }}
    >
      <LegalSection title="1. Agreement">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of {LEGAL.siteName} (
          {LEGAL.siteUrl}), operated by {LEGAL.operatorName} (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;). By accessing or using {LEGAL.siteName}, you agree to these Terms. If you do not
          agree, do not use the service.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          {LEGAL.siteName} is a platform for discovering, sharing, and ranking web publications such as blogs
          and newsletters. We provide tools for users to submit publications, comment, upvote, and browse
          community-curated content. {LEGAL.siteName} is a hosting and discovery service; we are not the
          publisher of user-submitted content and do not endorse user submissions.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <p>
          You must be at least 13 years old (or the minimum age required in your jurisdiction) to use{" "}
          {LEGAL.siteName}. If you are under 18, you represent that you have permission from a parent or
          guardian. Certain features, including submitting publications and interacting with content, require
          an account.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts">
        <p>
          You may sign in using Google Sign-In. You are responsible for maintaining the security of your
          account and for all activity that occurs under it. You agree to provide accurate profile information
          and to notify us promptly of any unauthorized use of your account.
        </p>
      </LegalSection>

      <LegalSection title="5. User Content">
        <p>
          You may submit publications, comments, links, tags, profile information, and ownership claims
          (&quot;User Content&quot;). You retain ownership of your User Content. By submitting User Content,
          you grant {LEGAL.operatorName} a worldwide, non-exclusive, royalty-free license to host, store,
          display, reproduce, and distribute your User Content on and through {LEGAL.siteName} for the purpose
          of operating and promoting the service.
        </p>
        <p>
          You represent that you have the rights necessary to submit User Content and that your submissions
          do not violate any third party&apos;s rights or applicable law.
        </p>
      </LegalSection>

      <LegalSection title="6. Publication Rules">
        <p>
          When you submit a publication, you provide your site&apos;s main URL (base domain). We normalize
          URLs to the base site (for example, a link to a specific article may be stored as your site&apos;s
          homepage URL). Only one publication per base site is permitted.
        </p>
        <p>
          If an unverified publication for the same base site already exists, a new submission may update
          that publication and transfer ownership to the new submitter. Once a publication is verified through
          our claims process, it cannot be updated, resubmitted, or transferred by another user.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Violate any applicable law or regulation</li>
          <li>Submit false, misleading, defamatory, or infringing content</li>
          <li>Upload malware, spam, or content intended to disrupt the service</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Scrape, crawl, or abuse the service in ways that impair its operation</li>
          <li>Attempt to gain unauthorized access to accounts, systems, or data</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Verification and Claims">
        <p>
          Users may submit claims to verify ownership of a publication. We review claims at our discretion.
          Verification affects what edits and resubmissions are permitted. We may approve, reject, or revoke
          verification status at any time. Verification does not constitute legal proof of ownership.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-Party Services and Links">
        <p>
          {LEGAL.siteName} integrates with third-party services including Google Sign-In and may link to
          external sites (including user-submitted publication URLs and partner services such as Blog2Video).
          We are not responsible for third-party services or websites. Your use of third-party services is
          governed by their own terms and policies.
        </p>
      </LegalSection>

      <LegalSection title="10. Intellectual Property">
        <p>
          The {LEGAL.siteName} name, logo, design, and underlying technology are owned by {LEGAL.operatorName}{" "}
          or its licensors and are protected by intellectual property laws. You may not copy, modify, or
          distribute our branding or software without permission.
        </p>
        <p>
          If you believe content on {LEGAL.siteName} infringes your copyright, contact us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-red-600 hover:text-red-700">
            {LEGAL.contactEmail}
          </a>{" "}
          with sufficient detail to identify the work and the allegedly infringing material.
        </p>
      </LegalSection>

      <LegalSection title="11. Disclaimers">
        <p>
          {LEGAL.siteName} is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
          kind, whether express or implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the service will be uninterrupted, error-free, or that
          scraped metadata, rankings, or user-submitted information will be accurate or complete.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, {LEGAL.operatorName} and its affiliates, officers,
          employees, and agents will not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits, data, or goodwill, arising from your use of{" "}
          {LEGAL.siteName}. Our total liability for any claim arising from these Terms or the service will not
          exceed the greater of (a) the amount you paid us in the twelve months before the claim, or (b) one
          hundred U.S. dollars (USD $100).
        </p>
      </LegalSection>

      <LegalSection title="13. Indemnification">
        <p>
          You agree to indemnify and hold harmless {LEGAL.operatorName} and its affiliates from any claims,
          damages, losses, or expenses (including reasonable legal fees) arising from your User Content, your
          use of the service, or your violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="14. Termination">
        <p>
          You may stop using {LEGAL.siteName} at any time. We may suspend or terminate your access, or remove
          content, at our discretion if we believe you have violated these Terms or if necessary to protect the
          service or other users. Provisions that by their nature should survive termination will survive.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes to These Terms">
        <p>
          We may update these Terms from time to time. We will post the revised Terms on this page and update
          the &quot;Last updated&quot; date. Continued use of {LEGAL.siteName} after changes become effective
          constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="16. Governing Law">
        <p>
          These Terms are governed by {LEGAL.governingLaw}, without regard to conflict-of-law principles. Any
          disputes will be resolved in the courts of competent jurisdiction, unless otherwise required by
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="17. Contact">
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-red-600 hover:text-red-700">
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
