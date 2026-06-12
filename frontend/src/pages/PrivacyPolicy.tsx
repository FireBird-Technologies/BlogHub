import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import { LEGAL } from "../constants/legal";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description={`Privacy Policy for ${LEGAL.siteName} — how we collect, use, and protect your information.`}
      canonicalPath="/privacy"
      crossLink={{ label: "Terms of Service", to: "/terms" }}
    >
      <LegalSection title="1. Introduction">
        <p>
          {LEGAL.operatorName} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates {LEGAL.siteName}{" "}
          at {LEGAL.siteUrl}. This Privacy Policy explains how we collect, use, disclose, and protect
          information when you use our service. By using {LEGAL.siteName}, you agree to the practices described
          here.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>
          <strong>Account information from Google.</strong> When you sign in with Google, we receive
          information from Google such as your name, email address, profile picture, and Google account
          identifier. We use this to create and maintain your account.
        </p>
        <p>
          <strong>Profile information you provide.</strong> You may provide a username tag, website URL, bio,
          and avatar preferences as part of your profile.
        </p>
        <p>
          <strong>Content you submit.</strong> This includes publications (title, description, image, category,
          tags, links, and social profiles), comments, upvotes, and publication ownership claims.
        </p>
        <p>
          <strong>URLs you submit.</strong> When you add a publication, we normalize the URL to your site&apos;s
          base domain. The URL you paste may be sent to third-party scraping services to fetch metadata (title,
          description, thumbnail).
        </p>
        <p>
          <strong>Technical information.</strong> Our servers may log information such as your IP address,
          browser type, request timestamps, and pages accessed. We store an authentication token in your
          browser&apos;s local storage to keep you signed in.
        </p>
      </LegalSection>

      <LegalSection title="3. How We Use Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Provide, operate, and maintain {LEGAL.siteName}</li>
          <li>Authenticate you and manage your account</li>
          <li>Display your profile, publications, comments, and rankings</li>
          <li>Process publication ownership claims and send related notifications</li>
          <li>Improve, secure, and troubleshoot the service</li>
          <li>Comply with legal obligations and enforce our Terms of Service</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal Bases for Processing">
        <p>
          Where applicable law requires a legal basis, we process personal data based on: (a) performance of a
          contract with you (providing the service); (b) our legitimate interests (security, improvement,
          fraud prevention); and (c) your consent where required (for example, certain optional features).
        </p>
      </LegalSection>

      <LegalSection title="5. Third-Party Services">
        <p>We use the following categories of third-party services:</p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>
            <strong>Google</strong> — Sign-In and Identity Services. See{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Firecrawl</strong> — optional service to fetch metadata from URLs you submit when adding a
            publication.
          </li>
          <li>
            <strong>OpenRouter</strong> — optional AI service used to enrich publication descriptions when
            configured.
          </li>
          <li>
            <strong>Resend</strong> — email delivery for publication claim notifications to site operators.
          </li>
          <li>
            <strong>Hosting and database providers</strong> — infrastructure used to run {LEGAL.siteName} and
            store data in PostgreSQL.
          </li>
        </ul>
        <p>
          These providers process data on our behalf subject to their own privacy policies and our instructions
          where applicable.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies and Local Storage">
        <p>
          We store a JSON Web Token (JWT) in your browser&apos;s local storage to maintain your signed-in
          session. We do not use advertising or analytics cookies on {LEGAL.siteName}. Google may set its own
          cookies or use similar technologies when you use Google Sign-In; those are governed by Google&apos;s
          policies.
        </p>
      </LegalSection>

      <LegalSection title="7. How We Share Information">
        <p>
          <strong>Public information.</strong> Your profile tag, name, avatar, publications, comments, and
          upvote activity may be visible to other users and the public depending on how you use the service.
        </p>
        <p>
          <strong>Service providers.</strong> We share information with the third-party processors listed above
          as needed to operate the service.
        </p>
        <p>
          <strong>Legal requirements.</strong> We may disclose information if required by law, court order, or
          government request, or to protect rights, safety, and security.
        </p>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="8. Data Retention">
        <p>
          We retain account and content data for as long as your account exists or as needed to provide the
          service. Server logs are retained for a reasonable period for security and troubleshooting. You may
          request deletion of your account or specific content by contacting us.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, or restrict processing of
          your personal data, or to data portability. To exercise these rights, contact us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-red-600 hover:text-red-700">
            {LEGAL.contactEmail}
          </a>
          . You may also manage certain Google account data through your Google account settings.
        </p>
      </LegalSection>

      <LegalSection title="10. Security">
        <p>
          We use reasonable technical and organizational measures to protect your information. However, no
          method of transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="11. Children's Privacy">
        <p>
          {LEGAL.siteName} is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If you believe a child has provided us personal information,
          contact us and we will take steps to delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. International Transfers">
        <p>
          Your information may be processed and stored in countries other than your own, including where our
          hosting providers and third-party services operate. By using {LEGAL.siteName}, you consent to such
          transfers where permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised policy on this page and
          update the &quot;Last updated&quot; date. We encourage you to review this page periodically.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact Us">
        <p>
          Questions about this Privacy Policy? Contact us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-red-600 hover:text-red-700">
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
