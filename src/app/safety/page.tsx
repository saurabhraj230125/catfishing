import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Eye, Flag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Online Safety & Community Guidelines | Catch Me If You Can',
  description:
    'Comprehensive safety guide for chatting with strangers online. Learn to recognize red flags, protect your identity, and play fair.',
};

export default function SafetyRulesPage() {
  return (
    <LegalPageLayout
      title="Online Safety & Community Rules"
      subtitle="How to protect your digital wellbeing, identify deceitful red flags, and report bad actors."
      badge="Safety & Well-being"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          1. The Golden Rule of Anonymous Chat
        </h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 font-medium text-sm leading-relaxed">
          <p className="font-extrabold text-amber-900 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Never Share Personal or Financial Identifiers</span>
          </p>
          <p>
            Catch Me If You Can is designed as a self-contained game of wits. <strong>Never</strong> disclose your real telephone number, WhatsApp, Instagram handle, home address, bank account number, UPI IDs, or school/workplace names to strangers in the pond.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          2. Recognizing Common Catfisher Red Flags 🚩
        </h2>
        <p>
          Whether in our game or anywhere else on the web, deceitful accounts share predictable behavioral signals:
        </p>

        <div className="space-y-2.5">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Premature Declarations of Affection</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Lines like &quot;Aap mujhe pehle kyu nahi mile warna aapko hi bana leti&quot; within the first 60 seconds are classic emotional hooks designed to make you lower your analytical guard.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Excessive Backspacing & Story Inconsistencies</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Our in-game telemetry watches typing flow. Deceivers often backspace repeatedly when asked specific questions (like their high school city or college campus) because fabricating a fake persona takes cognitive effort.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pressure to Move Off-Platform</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                If someone asks you for your personal WhatsApp or Telegram immediately, treat it as an immediate red flag and disconnect.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          3. How to Protect Yourself
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-teal-950">
              <Lock className="w-4 h-4 text-teal-700" />
              <span>Use Persona Presets</span>
            </div>
            <p className="text-teal-900">
              Pick from our 16 illustrated avatars and creative Hinglish bios instead of using real photos.
            </p>
          </div>

          <div className="p-3.5 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-950">
              <Eye className="w-4 h-4 text-sky-700" />
              <span>Trust Your Intuition</span>
            </div>
            <p className="text-sky-900">
              If a conversation makes you feel uncomfortable or suspicious, tap the Skip / Cut Line button immediately.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">
          4. Immediate Reporting of Violations
        </h2>
        <p>
          We enforce a zero-tolerance policy against hate speech, harassment, financial fraud, and non-consensual content. If you observe any violation, email us at <code>safety@catchmeifyoucan.online</code> with relevant session details.
        </p>
      </section>
    </LegalPageLayout>
  );
}
