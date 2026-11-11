import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { Sparkles, Heart, Shield, Users, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Catch Me If You Can',
  description:
    'Learn about Catch Me If You Can (Pond Chat). Our mission to reinvent social deduction gaming with privacy, humor, and fair play.',
};

export default function AboutUsPage() {
  return (
    <LegalPageLayout
      title="About Catch Me If You Can"
      subtitle="Who we are, why we built the pond, and our mission to make online social deduction playful and safe."
      badge="Our Mission & Story"
    >
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          1. The Vision Behind the Pond
        </h2>
        <p>
          In an era dominated by algorithmic social media feeds, hyper-curated profiles, and superficial dating apps, genuine and spontaneous conversation has become rare.
        </p>
        <p>
          <strong>Catch Me If You Can</strong> was born from a simple, playful idea: <em>What if meeting a stranger online felt like a cozy game of deduction by a peaceful sunlit pond?</em>
        </p>
        <p>
          We took the classic thrill of social deduction party games (like Mafia, Werewolf, and Among Us) and distilled it into an anonymous 1-on-1 text chat. Players cast their fishing line into the pond, match with an anonymous peer, and embark on a 3-minute psychological duel of wits: <strong>Is your stranger authentic, or an undercover Catfisher testing your loyalty?</strong>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          2. Who Runs Catch Me If You Can?
        </h2>
        <p>
          Catch Me If You Can is independently designed and engineered by <strong>Angler Studio</strong>, a passionate collective of web engineers, game designers, and UI/UX enthusiasts.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 text-lg">
              🎣
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Game Design</h3>
            <p className="text-xs text-slate-500 mt-1">
              Crafting loyalty mechanics, Hinglish savage lines, and fair XP scoring.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center mx-auto mb-2 text-lg">
              ⚡
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Real-time Tech</h3>
            <p className="text-xs text-slate-500 mt-1">
              Low-latency Cloud Firestore matchmaking and procedural Web Audio synthesis.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 text-lg">
              🛡️
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">User Safety</h3>
            <p className="text-xs text-slate-500 mt-1">
              Proactive safety prompts, data minimization, and fair play oversight.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          3. Our Core Pillars
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100">
            <Shield className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-teal-950 text-sm">1. Privacy First & Anonymous by Default</h3>
              <p className="text-xs text-teal-900 mt-0.5">
                No phone numbers, no social scraping, and no tracking cookies sold to data brokers. You play under your chosen persona and can disconnect anytime.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100">
            <Sparkles className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-950 text-sm">2. Zero Heavy Downloads & Instant Access</h3>
              <p className="text-xs text-rose-900 mt-0.5">
                Built with native Web Audio synthesis and Progressive Web App technology. The entire experience runs in your browser in milliseconds on any device.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100">
            <Trophy className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-950 text-sm">3. Fair Gamification & Humor</h3>
              <p className="text-xs text-amber-900 mt-0.5">
                Whether you spot the &quot;Fake Rich Boy with a Rented Mustang&quot; or bluff your way through as a mystery influencer, you earn XP and level up your Angler badge.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          4. Contact Our Team
        </h2>
        <p>
          We love hearing from our community! Whether you have ideas for new savage Hinglish lines, character avatars, or partnership queries:
        </p>
        <div className="bg-slate-100/80 rounded-2xl p-4 font-mono text-xs sm:text-sm text-slate-800 border border-slate-200">
          <div><strong>Editorial & Operations:</strong> contact@catchmeifyoucan.online</div>
          <div><strong>Support Desk:</strong> support@catchmeifyoucan.online</div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
