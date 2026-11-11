import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { Sparkles, Trophy, HelpCircle, Target, Flame, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Play Catch Me If You Can | Complete Game Guide',
  description:
    'Master the art of social deduction in Catch Me If You Can (Pond Chat). Walkthrough of matchmaking, chat analysis, catfish detection, and XP streaks.',
};

export default function HowToPlayPage() {
  return (
    <LegalPageLayout
      title="How to Play Catch Me If You Can"
      subtitle="The complete guide to mastering social deduction, detecting bluffing partners, and leveling up your Angler rank."
      badge="Player Walkthrough"
    >
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          1. The Core Concept
        </h2>
        <p>
          Catch Me If You Can is a turn-based social deduction game that takes place inside a tranquil digital pond. You are paired 1-on-1 with an anonymous stranger. Your primary objective: <strong>Find out if your partner is telling the truth or playing an elaborate undercover catfish persona!</strong>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          2. Step-by-Step Gameplay Loop
        </h2>

        <div className="space-y-3">
          <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">1</span>
              <span>Select Your Secret Role</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pl-8">
              Choose whether you will chat as <strong>Normal (100% Asli)</strong> or play the <strong>Catfisher (The Deceiver)</strong>. Your opponent cannot see your selection!
            </p>
          </div>

          <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">2</span>
              <span>Craft Your Persona</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pl-8">
              Pick your displayed identity (Boy or Girl), select an illustrated avatar, choose vibe tags (like <em>&quot;💸 Fake Rich Vibes&quot;</em> or <em>&quot;💔 Loyalty Tester&quot;</em>), and set a bio. You can hit <strong>🎲 Quick Spark</strong> for instant Hinglish inspiration.
            </p>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">3</span>
              <span>Cast Your Rod Into the Pond</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pl-8">
              Our real-time matchmaking queue pairs you with a live partner. When a bite occurs, your phone vibrates and a water splash alert sounds!
            </p>
          </div>

          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">4</span>
              <span>Chat, Interrogate & Double-Tap React</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pl-8">
              Engage in snappy conversation. Use the <strong>🎲 Savage Line Roulette</strong> to throw curveballs like <em>&quot;Pani Puri, Golgappa, ya Puchka? Sahi choice se character pata chalta hai!&quot;</em>. Watch their typing activity and backspace telemetry in real time.
            </p>
          </div>

          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">5</span>
              <span>Submit Guess & Reveal Truth</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pl-8">
              Toggle your top prediction between <strong>✨ Asli</strong> and <strong>🎭 Catfish</strong>. When you hit <strong>Cut Line (Next)</strong>, the 3-second countdown reveals their true identity!
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          3. Scoring, XP & Streaks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">+50 XP for Accurate Deduction</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Correctly guessing whether your opponent was authentic or a catfish awards +50 XP and increments your Fish Caught counter.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Winning Streaks</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Every consecutive correct guess increases your active flame streak. Fooled by a catfish? Your streak resets back to 0!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          4. Pro Tips for Detective Anglers
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
          <li><strong>Test Local Nuances:</strong> Ask which metro station or street market they frequent. Catfishers playing a role from another region usually stumble.</li>
          <li><strong>Watch the Typing Indicator:</strong> If the typing indicator flickers on and off 5 times before a short reply appears, they are carefully calculating their story.</li>
          <li><strong>Check Vibe Consistency:</strong> If their bio claims &quot;Simple 2 AM Maggi lover&quot; but their chat drops luxury car flexes, you have likely caught a catfish.</li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
