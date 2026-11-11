'use client';

import React, { useState } from 'react';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { Mail, Clock, Send, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';
import { playCastSound, triggerHaptic } from '@/lib/soundEffects';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Question');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    playCastSound();
    triggerHaptic('medium');
    setSubmitted(true);
  };

  return (
    <LegalPageLayout
      title="Contact Us"
      subtitle="Have questions, partnership inquiries, or safety feedback? Reach out to our team."
      badge="Support & Partnerships"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-extrabold text-sm">
              <Mail className="w-4 h-4 text-teal-600" />
              <span>Direct Support Channels</span>
            </div>
            <p className="text-xs text-teal-950 font-medium">
              We monitor incoming inquiries actively and respond to all player and reviewer requests.
            </p>
            <div className="pt-2 font-mono text-xs text-teal-900 space-y-1">
              <div><strong>General Support:</strong> support@catchmeifyoucan.online</div>
              <div><strong>AdSense & Business:</strong> partnerships@catchmeifyoucan.online</div>
              <div><strong>Safety & Reports:</strong> safety@catchmeifyoucan.online</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Response Window</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Our support desk operates Monday through Friday. Standard responses are delivered within 24 to 48 business hours.
            </p>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Reporting Inappropriate Behavior</span>
            </div>
            <p className="text-xs text-amber-950 font-medium">
              If you encountered someone violating community rules, please mention the approximate session time and player handle so our safety desk can review connection records.
            </p>
          </div>
        </div>

        {/* Interactive Form */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-5 sm:p-6 shadow-sm">
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Message Received!</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto font-medium">
                Thank you for reaching out, {name}. Our team has received your message and will get back to you at {email} within 24–48 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                type="button"
                className="mt-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base border-b border-slate-100 pb-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>Send a Direct Inquiry</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe or AnglerDev"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold bg-white"
                >
                  <option value="General Question">General Question</option>
                  <option value="AdSense Review / Advertising">AdSense Review / Advertising</option>
                  <option value="Safety & User Report">Safety & User Report</option>
                  <option value="Technical Bug / Feedback">Technical Bug / Feedback</option>
                  <option value="Data & Privacy Request">Data & Privacy Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you today? Please provide relevant details."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] touch-manipulation cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </LegalPageLayout>
  );
}
