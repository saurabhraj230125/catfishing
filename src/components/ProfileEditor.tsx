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
  UserCheck,
  Dices,
  Sparkles
} from 'lucide-react';

interface ProfileEditorProps {
  initialUid: string;
  initialDisplayName: string;
  secretIdentity: SecretIdentity;
  onProfileComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

// 8 Distinct Boy Character Avatars
const BOY_AVATARS = [
  { id: 'b1', name: 'Kabir (Gym Bro)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KabirGymBro&backgroundColor=b6e3f4' },
  { id: 'b2', name: 'Dev (Rich Kid)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DevRichKid&backgroundColor=c0aede' },
  { id: 'b3', name: 'Aarav (Chill Gamer)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AaravChill&backgroundColor=d1d4f9' },
  { id: 'b4', name: 'Rohan (Streetwear)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RohanStreet&backgroundColor=ffdfbf' },
  { id: 'b5', name: 'Vivaan (Indie Musician)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=VivaanGuitar&backgroundColor=ffd5dc' },
  { id: 'b6', name: 'Sam (Tapri Chai)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SamTapriBoy&backgroundColor=b6e3f4' },
  { id: 'b7', name: 'Yash (Shades & Style)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=YashShades&backgroundColor=c0aede' },
  { id: 'b8', name: 'Phantom (Mystery)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PhantomBoy&backgroundColor=d1d4f9' },
];

// 8 Distinct Girl Character Avatars
const GIRL_AVATARS = [
  { id: 'g1', name: 'Kyra (Insta Model)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KyraInsta&backgroundColor=ffd5dc' },
  { id: 'g2', name: 'Simran (Hostel Maggi)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SimranMaggi&backgroundColor=ffdfbf' },
  { id: 'g3', name: 'Ananya (Boho Artist)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AnanyaBoho&backgroundColor=ffd5dc' },
  { id: 'g4', name: 'Kriti (College Chill)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KritiCollege&backgroundColor=c0aede' },
  { id: 'g5', name: 'Riya (Sassy Gossip)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RiyaSassy&backgroundColor=ffd5dc' },
  { id: 'g6', name: 'Tanya (Luxury Luxe)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TanyaLuxe&backgroundColor=ffdfbf' },
  { id: 'g7', name: 'Meera (Cafe & Books)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MeeraCafe&backgroundColor=d1d4f9' },
  { id: 'g8', name: 'Mystic (Secret Mask)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MysticGirl&backgroundColor=ffd5dc' },
];

const HINGLISH_VIBE_PILLS = [
  '💸 Fake Rich Vibes',
  '💔 Loyalty Tester',
  '🤝 Bhaichara On Top',
  '🍀 Dil Garden Garden',
  '☕ Tapri Chai',
  '🍜 2 AM Hostel Maggi',
  '🧢 Full Cap',
  '🚩 Walking Red Flag',
];

// Presets for "Roll Fun Persona" button
const FUN_PERSONA_ROLLS = {
  boy: [
    { displayName: 'Kabir Sharma', username: '@kabir_lifts', bio: 'Yahan imaandari chalta hai babu, test your loyalty ☕', vibes: ['💔 Loyalty Tester', '🤝 Bhaichara On Top'] },
    { displayName: 'Dev Singhania', username: '@dev_billionaire', bio: 'Rented Mustang & Fake Rich Vibes 🏎️ DM for collabs', vibes: ['💸 Fake Rich Vibes', '🧢 Full Cap'] },
    { displayName: 'Aarav Verma', username: '@aarav.verma', bio: '2 AM Maggi, Valorant & wholesome conversations 🍜', vibes: ['🍜 2 AM Hostel Maggi', '🤝 Bhaichara On Top'] },
    { displayName: 'Rohan Mehra', username: '@rohan_mehra_', bio: 'Aap mujhe pehle kyu nahi mile? Chalo ab mil gaye ✨', vibes: ['🍀 Dil Garden Garden', '☕ Tapri Chai'] },
  ],
  girl: [
    { displayName: 'Kyra Singh', username: '@kyra.singh_', bio: 'Aap mujhe pehle nahi mile, warna aapko hi bana leti 😭', vibes: ['💸 Fake Rich Vibes', '🚩 Walking Red Flag'] },
    { displayName: 'Simran Yadav', username: '@simran_yadav', bio: 'Hostel warden se chupke chatting • 100% Asli vibes ☕', vibes: ['🍜 2 AM Hostel Maggi', '💔 Loyalty Tester'] },
    { displayName: 'Ananya Roy', username: '@ananya_aesthetic', bio: 'Swipe kiya toh sach bolna padega babu 🌸', vibes: ['🍀 Dil Garden Garden', '🤝 Bhaichara On Top'] },
    { displayName: 'Riya Kapoor', username: '@riya_kapoor', bio: 'Dil garden garden ho raha hai aapki profile dekh ke ✨', vibes: ['💸 Fake Rich Vibes', '🍀 Dil Garden Garden'] },
  ],
};

export function ProfileEditor({
  initialUid,
  initialDisplayName,
  secretIdentity,
  onProfileComplete,
  onBack,
}: ProfileEditorProps) {
  const isCatfisher = secretIdentity === 'catfisher';

  // Default presented gender based on secret role
  const [presentedGender, setPresentedGender] = useState<PresentedGender>(
    isCatfisher ? 'girl' : 'boy'
  );

  // Dynamic avatars based on chosen gender
  const currentAvatars = presentedGender === 'boy' ? BOY_AVATARS : GIRL_AVATARS;

  // Form states with empty blanks / prompts
  const [displayName, setDisplayName] = useState(
    initialDisplayName && initialDisplayName !== 'Angler' ? initialDisplayName : ''
  );
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(
    isCatfisher ? GIRL_AVATARS[0].url : BOY_AVATARS[0].url
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([
    isCatfisher ? '💸 Fake Rich Vibes' : '💔 Loyalty Tester',
    '🤝 Bhaichara On Top',
  ]);

  // Gender toggle switches avatar gallery and defaults
  const handleGenderToggle = (newGender: PresentedGender) => {
    setPresentedGender(newGender);
    const newGallery = newGender === 'boy' ? BOY_AVATARS : GIRL_AVATARS;
    if (!showCustomAvatarInput) {
      setAvatar(newGallery[0].url);
    }
  };

  // Roll Fun Persona generator for instant inspiration
  const handleRollRandomPersona = () => {
    const list = FUN_PERSONA_ROLLS[presentedGender];
    const pick = list[Math.floor(Math.random() * list.length)];
    setDisplayName(pick.displayName);
    setUsername(pick.username);
    setBio(pick.bio);
    setSelectedVibes(pick.vibes);
  };

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else {
      if (selectedVibes.length < 3) {
        setSelectedVibes([...selectedVibes, vibe]);
      }
    }
  };

  const handleSaveAndCast = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean or provide defaults if left blank
    const fallbackName = presentedGender === 'boy' ? 'Dev Rajput' : 'Kyra Singh';
    const fallbackHandle = presentedGender === 'boy' ? '@dev_rajput' : '@kyra_singh';
    const fallbackBio = isCatfisher
      ? 'Aap mujhe pehle nahi mile warna aapko hi bana leti ✨'
      : 'Yahan imaandari chalta hai babu, test your loyalty ☕';

    const finalName = displayName.trim() || fallbackName;
    let finalHandle = username.trim() || fallbackHandle;
    if (!finalHandle.startsWith('@')) {
      finalHandle = `@${finalHandle}`;
    }
    const finalBio = bio.trim() || fallbackBio;

    const finalAvatar = showCustomAvatarInput && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : avatar;

    const profile: UserProfile = {
      uid: initialUid,
      displayName: finalName,
      username: finalHandle,
      avatar: finalAvatar,
      bio: finalBio.slice(0, 70),
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
    <div className="relative z-10 w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.16)] p-4 sm:p-6"
      >
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            type="button"
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
                  Catfish Disguise
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Real Persona
                </>
              )}
            </span>
          </div>
        </div>

        {/* Title & Quick Roll Helper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isCatfisher ? 'CRAFT YOUR DISGUISE' : 'CRAFT YOUR CHARACTER'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              {isCatfisher
                ? 'Create the fake profile your matched stranger will see in their DM.'
                : 'Create your public persona card. Test their loyalty in live chat.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRollRandomPersona}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-black transition-all shadow-2xs self-start sm:self-auto"
            title="Roll random Hinglish persona"
          >
            <Dices className="w-3.5 h-3.5 text-amber-600" />
            <span>🎲 Quick Spark</span>
          </button>
        </div>

        {/* ========================================================
            LIVE INTERACTIVE "INSTAGRAM STORY" CARD PREVIEW
            ======================================================== */}
        <div className="w-full bg-gradient-to-r from-slate-50 via-teal-50/30 to-sky-50/40 rounded-2xl border border-slate-200 p-3 mb-4 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Story Ring Avatar */}
            <div className="relative p-0.5 rounded-full insta-story-ring flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-white p-0.5">
                <img
                  src={showCustomAvatarInput && customAvatarUrl.trim() ? customAvatarUrl.trim() : avatar}
                  alt="Avatar Preview"
                  className="w-full h-full rounded-full object-cover bg-slate-100"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 truncate">
                  {displayName.trim() || (presentedGender === 'boy' ? 'Dev Rajput' : 'Kyra Singh')}
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {presentedGender}
                </span>
                <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold ml-auto flex-shrink-0">
                  🟢 Online
                </span>
              </div>

              <div className="text-xs font-mono font-semibold text-slate-500 truncate">
                {username.trim() ? (username.startsWith('@') ? username : `@${username}`) : (presentedGender === 'boy' ? '@dev_rajput' : '@kyra_singh')}
              </div>

              <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5 italic">
                "{bio.trim() || (isCatfisher ? 'Aap mujhe pehle nahi mile warna aapko hi bana leti ✨' : 'Yahan imaandari chalta hai babu ☕')}"
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveAndCast} className="space-y-3.5">
          {/* Presented Gender Switcher (Boy ↔ Girl) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                1. Select Character Gender
              </label>
              {isCatfisher && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  🎭 Tip: Boys can play GIRL to catfish!
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleGenderToggle('boy')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-2xl font-black text-xs sm:text-sm border-2 transition-all ${
                  presentedGender === 'boy'
                    ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👦</span>
                <span>BOY CHARACTER</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderToggle('girl')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-2xl font-black text-xs sm:text-sm border-2 transition-all ${
                  presentedGender === 'girl'
                    ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👧</span>
                <span>GIRL CHARACTER</span>
              </button>
            </div>
          </div>

          {/* 8 Character Avatars Gallery (Dynamic for selected gender) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                2. Choose Avatar ({presentedGender === 'boy' ? 'Boy Avatars' : 'Girl Avatars'})
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                Tap to select
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {currentAvatars.map((p) => {
                const isSelected = !showCustomAvatarInput && avatar === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setShowCustomAvatarInput(false);
                      setAvatar(p.url);
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-400 scale-105 shadow-md bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 hover:scale-102 bg-white'
                    }`}
                    title={p.name}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/35 flex items-center justify-center rounded-xl">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom URL Input Toggle */}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showCustomAvatarInput ? 'Hide Custom Image URL' : 'Or paste custom image link...'}</span>
              </button>
            </div>

            {showCustomAvatarInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-1.5"
              >
                <input
                  type="url"
                  placeholder="Paste direct avatar URL (https://...)"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </motion.div>
            )}
          </div>

          {/* 3. Display Name & @Username Blanks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                  Display Name
                </label>
                <span className="text-[10px] text-slate-400">Your public name</span>
              </div>
              <input
                type="text"
                maxLength={25}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={presentedGender === 'boy' ? 'e.g. Kabir Sharma, Dev Rajput' : 'e.g. Kyra Singh, Simran Yadav'}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm font-semibold text-slate-900 bg-white touch-manipulation"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                  @Instagram Handle
                </label>
                <span className="text-[10px] text-slate-400">Stranger sees this</span>
              </div>
              <input
                type="text"
                maxLength={22}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={presentedGender === 'boy' ? '@kabir_lifts, @dev_richkid' : '@kyra.singh_, @simran_yadav'}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm font-mono font-semibold text-slate-900 bg-white touch-manipulation"
              />
            </div>
          </div>

          {/* 4. Bio Blank */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                Instagram Bio
              </label>
              <span className={`text-[10px] font-mono ${bio.length >= 70 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {bio.length}/70
              </span>
            </div>
            <input
              type="text"
              maxLength={70}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                isCatfisher
                  ? 'e.g. Aap mujhe pehle kyu nahi mile warna aapko hi bana leti ✨'
                  : 'e.g. Yahan imaandari chalta hai babu, test your loyalty ☕'
              }
              className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm text-slate-900 font-medium bg-white touch-manipulation"
            />
          </div>

          {/* 5. Vibe Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                Hinglish Vibe Badges
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                {selectedVibes.length}/3 chosen
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HINGLISH_VIBE_PILLS.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => toggleVibe(vibe)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Submit Button: 🎣 CAST LINE INTO POND */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-black text-sm sm:text-base tracking-wide shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>🎣</span>
              <span>CAST LINE INTO THE POND</span>
              <Sparkles className="w-4 h-4 ml-0.5 opacity-80" />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
