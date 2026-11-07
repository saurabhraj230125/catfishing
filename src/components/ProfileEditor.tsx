'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserProfile, 
  SecretIdentity, 
  PresentedGender 
} from '@/types/pond';
import { 
  ArrowLeft, 
  Check, 
  Image as ImageIcon, 
  VenetianMask, 
  UserCheck 
} from 'lucide-react';

interface ProfileEditorProps {
  initialUid: string;
  initialDisplayName: string;
  secretIdentity: SecretIdentity;
  onProfileComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

const PRESET_AVATARS = [
  // 4 Boy Avatars
  { id: 'b1', gender: 'boy', name: 'Dev', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DevRich&backgroundColor=b6e3f4' },
  { id: 'b2', gender: 'boy', name: 'Kabir', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KabirVibes&backgroundColor=c0aede' },
  { id: 'b3', gender: 'boy', name: 'Aarav', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AaravLifts&backgroundColor=d1d4f9' },
  { id: 'b4', gender: 'boy', name: 'Rohan', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RohanSharma&backgroundColor=b6e3f4' },
  // 4 Girl Avatars
  { id: 'g1', gender: 'girl', name: 'Kyra', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KyraSingh&backgroundColor=ffd5dc' },
  { id: 'g2', gender: 'girl', name: 'Simran', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SimranYadav&backgroundColor=ffdfbf' },
  { id: 'g3', gender: 'girl', name: 'Ananya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AnanyaHostel&backgroundColor=ffd5dc' },
  { id: 'g4', gender: 'girl', name: 'Kriti', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KritiWrites&backgroundColor=ffdfbf' },
];

const HINGLISH_VIBE_PILLS = [
  '💸 Fake Rich Vibes',
  '💔 Loyalty Tester',
  '🤝 Bhaichara On Top',
  '🍀 Dil Garden Garden',
  '☕ Tapri Chai',
  '🍜 2 AM Hostel Maggi',
];

export function ProfileEditor({
  initialUid,
  initialDisplayName,
  secretIdentity,
  onProfileComplete,
  onBack,
}: ProfileEditorProps) {
  const isCatfisher = secretIdentity === 'catfisher';

  const defaultBoyHandle = '@dev_richkid';
  const defaultGirlHandle = '@kyra_singh';

  const [presentedGender, setPresentedGender] = useState<PresentedGender>(
    isCatfisher ? 'girl' : 'boy'
  );
  const [displayName, setDisplayName] = useState(
    isCatfisher ? 'Kyra Singh' : (initialDisplayName !== 'Angler' ? initialDisplayName : 'Dev Rajput')
  );
  const [username, setUsername] = useState(
    isCatfisher ? defaultGirlHandle : defaultBoyHandle
  );
  const [avatar, setAvatar] = useState(
    isCatfisher ? PRESET_AVATARS[4].url : PRESET_AVATARS[0].url
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [bio, setBio] = useState(
    isCatfisher
      ? 'Aap mujhe pehle nahi mile, warna aapko hi bana leti ✨'
      : 'Yahan imaandari chalta hai babu, test your loyalty ☕'
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>([
    isCatfisher ? '💸 Fake Rich Vibes' : '💔 Loyalty Tester',
    '🤝 Bhaichara On Top',
  ]);

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else {
      if (selectedVibes.length < 3) {
        setSelectedVibes([...selectedVibes, vibe]);
      }
    }
  };

  const handleGenderToggle = (newGender: PresentedGender) => {
    setPresentedGender(newGender);
    if (!showCustomAvatarInput) {
      const match = PRESET_AVATARS.find((a) => a.gender === newGender);
      if (match) setAvatar(match.url);
    }
    if (newGender === 'girl') {
      if (username === defaultBoyHandle || username === '@angler') setUsername(defaultGirlHandle);
      if (displayName === 'Dev Rajput' || displayName === 'Angler') setDisplayName('Kyra Singh');
    } else {
      if (username === defaultGirlHandle) setUsername(defaultBoyHandle);
      if (displayName === 'Kyra Singh') setDisplayName('Dev Rajput');
    }
  };

  const handleSaveAndCast = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.startsWith('@') ? username : `@${username}`;
    const finalAvatar = showCustomAvatarInput && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : avatar;

    const profile: UserProfile = {
      uid: initialUid,
      displayName: displayName.trim() || 'Desi Angler',
      username: cleanUsername.trim(),
      avatar: finalAvatar,
      bio: bio.trim().slice(0, 60),
      vibes: selectedVibes.length > 0 ? selectedVibes : ['🤝 Bhaichara On Top'],
      secretIdentity,
      presentedGender,
      xp: 0,
      streak: 0,
      fishCaught: 0,
    };

    onProfileComplete(profile);
  };

  return (
    <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.16)] p-5 sm:p-7"
      >
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-3 py-1 rounded-full ${
              isCatfisher 
                ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                : 'bg-sky-100 text-sky-700 border border-sky-300'
            }`}>
              {isCatfisher ? (
                <>
                  <VenetianMask className="w-3.5 h-3.5" />
                  Fake Persona Setup
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Real Identity Setup
                </>
              )}
            </span>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isCatfisher ? 'CRAFT YOUR CATFISH PERSONA' : 'INSTA-STYLE PROFILE SETUP'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            {isCatfisher
              ? 'This is the fake disguise your stranger will see in their Instagram DM.'
              : 'This is the real public profile your stranger will see in their Instagram DM.'}
          </p>
        </div>

        <form onSubmit={handleSaveAndCast} className="space-y-4">
          {/* Circular Avatar with Animated Instagram Story Gradient Ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-1 rounded-full insta-story-ring shadow-lg">
              <div className="w-20 h-20 rounded-full bg-white p-1">
                <img
                  src={showCustomAvatarInput && customAvatarUrl.trim() ? customAvatarUrl.trim() : avatar}
                  alt="Avatar Preview"
                  className="w-full h-full rounded-full object-cover bg-slate-100"
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Profile Avatar (Instagram Story Ring)
            </span>

            {/* 8 Preset Avatars */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {PRESET_AVATARS.map((p) => {
                const isSelected = !showCustomAvatarInput && avatar === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setShowCustomAvatarInput(false);
                      setAvatar(p.url);
                    }}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 transition-transform ${
                      isSelected
                        ? 'border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-300'
                        : 'border-slate-200 hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={p.name}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 text-xs transition-colors ${
                  showCustomAvatarInput
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-dashed border-slate-300 text-slate-500 hover:border-slate-400'
                }`}
                title="Custom Image URL"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {showCustomAvatarInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full mt-2"
              >
                <input
                  type="url"
                  placeholder="Paste avatar URL (https://...)"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </motion.div>
            )}
          </div>

          {/* Presented Gender Switcher (Boy ↔ Girl) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                Presented Gender
              </label>
              {isCatfisher && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  🎭 Tip: Boy can choose GIRL (or vice versa) to catfish!
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGenderToggle('boy')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-black text-sm border-2 transition-all ${
                  presentedGender === 'boy'
                    ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👦</span>
                <span>BOY</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderToggle('girl')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-black text-sm border-2 transition-all ${
                  presentedGender === 'girl'
                    ? 'border-rose-500 bg-rose-500 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👧</span>
                <span>GIRL</span>
              </button>
            </div>
          </div>

          {/* Display Name & @handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={25}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kyra Singh, Dev Rajput"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                @Instagram Handle
              </label>
              <input
                type="text"
                required
                maxLength={22}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. @kyra_singh, @dev_richkid"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Short Bio (Max 60 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Instagram Bio
              </label>
              <span className={`text-[11px] font-mono ${bio.length >= 60 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {bio.length}/60
              </span>
            </div>
            <input
              type="text"
              maxLength={60}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Aap mujhe pehle nahi mile warna aapko hi bana leti ✨"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 font-medium"
            />
          </div>

          {/* Preset Clickable Hinglish Vibe Pills (Pick up to 3) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hinglish Vibe Pills
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                {selectedVibes.length}/3 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {HINGLISH_VIBE_PILLS.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => toggleVibe(vibe)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary CTA: 🎣 CAST LINE INTO THE POND */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-black text-sm sm:text-base tracking-wide shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>🎣</span>
              <span>CAST LINE INTO THE POND</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
