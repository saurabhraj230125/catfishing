import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | Catch Me If You Can',
  description:
    'Terms of Service and Community Rules for Catch Me If You Can (Pond Chat). Code of conduct, fair play, and safety policies.',
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The rules of engagement, code of conduct, and safety guidelines for all anglers in the pond."
      badge="User Agreement"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using <strong>Catch Me If You Can</strong>, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          2. Social Deduction Gameplay Rules
        </h2>
        <p>
          Catch Me If You Can is a gamified social deduction experience where players are matched 1-on-1 and may roleplay as either an authentic stranger (&quot;Asli&quot;) or an undercover deceiver (&quot;Catfish&quot;).
        </p>
        <p>
          While creative persona creation and playful banter are the core premise of the game, players must observe strict boundaries. <strong>In-game deception must never cross into real-world fraud, financial solicitation, or malice.</strong>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          3. Prohibited Conduct (Zero Tolerance)
        </h2>
        <p>You agree NOT to engage in any of the following activities on our platform:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Financial Solicitation & Scams:</strong> Asking for money, cryptocurrency, UPI transfers, bank details, gift cards, or investment schemes is strictly banned.
          </li>
          <li>
            <strong>Hate Speech & Harassment:</strong> Any speech that promotes violence, discrimination, or hate against individuals based on race, religion, gender, sexual orientation, disability, or nationality.
          </li>
          <li>
            <strong>Adult or Explicit Material:</strong> Sharing pornographic, sexually explicit, graphic, or inappropriate content is strictly prohibited and leads to immediate IP and device exclusion.
          </li>
          <li>
            <strong>Doxxing & Personal Data Sharing:</strong> Attempting to uncover, publish, or extort real-world identities, home addresses, phone numbers, or private socials of fellow players.
          </li>
          <li>
            <strong>Automated Bots & Scraping:</strong> Using automated scripts, scrapers, or bots to flood the matchmaking queue or manipulate game telemetry.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          4. User Safety Disclaimer
        </h2>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950 text-sm font-medium">
          <p className="font-extrabold text-rose-900 mb-1">
            ⚠️ Safety Warning — Chat at Your Own Risk:
          </p>
          <p>
            Do NOT share sensitive personal information (such as your full legal name, phone number, address, financial passwords, or private accounts) with strangers in the pond. We are not responsible for any information you voluntarily disclose to other players.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          5. Intellectual Property
        </h2>
        <p>
          All branding, visual designs, animated panda assets, sound synthesis engines, and custom game mechanics are the proprietary property of Catch Me If You Can. You may not copy, reverse-engineer, or redistribute our software without explicit written permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          6. Limitation of Liability
        </h2>
        <p>
          In no event shall Catch Me If You Can or its creators be held liable for any damages arising out of the use or inability to use our entertainment platform, including but not limited to loss of data or connection interruptions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          7. Contact Information
        </h2>
        <p>
          For inquiries regarding our terms or community guidelines, please contact us at:
        </p>
        <div className="bg-slate-100/80 rounded-2xl p-4 font-mono text-xs sm:text-sm text-slate-800 border border-slate-200">
          <div><strong>Support Email:</strong> legal@catchmeifyoucan.online</div>
          <div><strong>Publisher:</strong> Angler Studio — Catch Me If You Can</div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
