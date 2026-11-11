import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Catch Me If You Can',
  description:
    'Comprehensive Privacy Policy for Catch Me If You Can (Pond Chat). Details on cookies, Google AdSense, Analytics, and data handling.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How we protect your privacy, handle session data, and use cookies for Google AdSense and Analytics."
      badge="AdSense & Legal Compliance"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          1. Introduction & Overview
        </h2>
        <p>
          Welcome to <strong>Catch Me If You Can</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), available at our official web domain. We operate a social deduction chat experience designed to connect users anonymously for lighthearted conversation and deduction games.
        </p>
        <p>
          We are committed to maintaining high standards of transparency, user trust, and digital privacy. This Privacy Policy outlines what information we collect, how it is used, how third-party services (such as Google AdSense and Google Analytics) function on our platform, and your rights concerning your personal data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          2. Google AdSense & Third-Party Advertising Cookies
        </h2>
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-amber-950 text-sm font-medium">
          <p className="font-extrabold text-amber-900 mb-1">
            Important Notice Regarding Third-Party Advertising:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Third-party vendors, including <strong>Google</strong>, use cookies to serve ads based on a user&apos;s prior visits to our website or other websites on the Internet.
            </li>
            <li>
              Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
            </li>
            <li>
              Users may opt out of personalized advertising by visiting{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-amber-950 hover:text-amber-800"
              >
                Google Ads Settings
              </a>
              . Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{' '}
              <a
                href="https://www.aboutads.info"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-amber-950 hover:text-amber-800"
              >
                www.aboutads.info
              </a>
              .
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          3. Information We Collect
        </h2>
        <p>
          We believe in data minimization. We only collect the minimal information necessary to deliver authentic peer-to-peer matchmaking and fair gaming:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Authentication Data:</strong> When you sign in via Google Authentication, Firebase securely receives your verified identifier, display name, and avatar image. We do not store or have access to your Google account password.
          </li>
          <li>
            <strong>Guest Sessions:</strong> If you choose the 1-Tap Guest option, a randomized temporary session identifier is created on your device without gathering any personal name or phone details.
          </li>
          <li>
            <strong>Chat Messages & In-Game Transmissions:</strong> Real-time messages sent in the pond are routed through Google Cloud Firestore to display between matched players. In-game messages are ephemeral and designed for the active session.
          </li>
          <li>
            <strong>Telemetry & Analytics:</strong> We use Google Analytics (GA4) with measurement identifier <code>G-4WB1K6XS9B</code> to understand traffic patterns, page response latency, and feature usage. This data is aggregated and does not identify individuals.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          4. How We Use Information
        </h2>
        <p>The information gathered is utilized strictly for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Facilitating 1-on-1 matchmaking in the pond queue.</li>
          <li>Maintaining user XP scores, loyalty streaks, and game leaderboards.</li>
          <li>Preventing abuse, spam, harassment, and bot manipulation.</li>
          <li>Evaluating website technical performance and responsive rendering.</li>
          <li>Serving relevant advertisements in compliance with Google AdSense program guidelines.</li>
        </ul>
        <p>
          <strong>We never sell, rent, or trade your personal information to any data brokers or third parties.</strong>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          5. GDPR & CCPA Compliance (Your Privacy Rights)
        </h2>
        <p>
          Depending on your location, you hold legal rights regarding your personal information under frameworks including the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA):
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Right to Access:</strong> You may request copies of personal records held by our system.</li>
          <li><strong>Right to Erasure / Deletion:</strong> You may request that we delete your stored scores or associated account records at any time.</li>
          <li><strong>Right to Restrict or Object:</strong> You can restrict or object to how specific data is processed.</li>
          <li><strong>Non-Discrimination:</strong> We will never discriminate against you for exercising your privacy rights.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          6. Children&apos;s Privacy (COPPA)
        </h2>
        <p>
          Our platform is intended for users who are at least 13 years of age (and 18 years of age or older where required by local laws or for advertising compliance). We do not knowingly collect personal data from children under 13. If you believe a child under 13 has submitted personal information, please contact us immediately to have it purged.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          7. Security of Your Information
        </h2>
        <p>
          All communication between your browser and our servers uses HTTPS TLS encryption. Cloud database entries are protected by strict Firestore security rules requiring active authentication tokens.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          8. Contact Our Privacy Officer
        </h2>
        <p>
          If you have questions, feedback, or data requests regarding this Privacy Policy, please contact our support team at:
        </p>
        <div className="bg-slate-100/80 rounded-2xl p-4 font-mono text-xs sm:text-sm text-slate-800 border border-slate-200">
          <div><strong>Support Email:</strong> support@catchmeifyoucan.online</div>
          <div><strong>Project:</strong> Catch Me If You Can — Angler Studio</div>
          <div><strong>Response Time:</strong> Within 24–48 business hours</div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
