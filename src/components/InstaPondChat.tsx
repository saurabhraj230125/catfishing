'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserProfile, 
  PublicPondProfile, 
  ChatMessage, 
  SecretIdentity 
} from '@/types/pond';
import {
  subscribeToChatRoom,
  sendChatMessage,
  toggleMessageHeart,
  updateTypingTelemetry,
  leaveChatRoom,
} from '@/lib/matchmaker';
import { 
  Send, 
  Scissors, 
  ChevronDown, 
  ChevronUp, 
  Dices, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface InstaPondChatProps {
  roomId: string;
  currentUser: UserProfile;
  opponent: PublicPondProfile;
  onNextMatch: (reward: { xpGained: number; isCorrect: boolean }) => void;
  onExit: () => void;
}

const SAVAGE_HINGLISH_LINES = [
  "Aap mujhe pehle nahi mile, warna aapko hi bana leti 👀",
  "Accha aapka BF/GF accha nahi hai kya? 💀",
  "Mera ex thoda rude tha aur kamata bhi nahi tha 😭",
  "Kisne follow kiya? Maine Bhagwan ke raah ko follow kiya hai 🙏",
  "Skip kar deta bhai, par mujhe aata nahi hai skip karna 😎",
  "Number de apna? 992... baaki aapki marzi 📞",
  "Bhai tera katega ganda wala, SS bheju kya? 🔥",
  "Aapne khana khaya? (Tone suddenly changed 👀)",
  "It's okay bhai, Bhaichara On Top 🤝",
];

export function InstaPondChat({
  roomId,
  currentUser,
  opponent,
  onNextMatch,
  onExit,
}: InstaPondChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [opponentTyping, setOpponentTyping] = useState<{ isTyping: boolean; backspaces: number }>({
    isTyping: false,
    backspaces: 0,
  });
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Live Guess Switch (Top Right): ✨ Normal vs 🎣 Catfisher
  const [userGuess, setUserGuess] = useState<SecretIdentity>('normal');

  // Keystroke & Backspace telemetry
  const backspaceCountRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3-Second "KHATAM HO GAYA BHAIYA MATTER!" Truth Reveal Overlay state
  const [showTruthReveal, setShowTruthReveal] = useState(false);
  const [truthCountdown, setTruthCountdown] = useState(3);
  const [revealScore, setRevealScore] = useState<{
    isCorrect: boolean;
    xpGained: number;
    trueRole: SecretIdentity;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to real-time messages & room updates
  useEffect(() => {
    const unsubscribe = subscribeToChatRoom(roomId, currentUser.uid, {
      onMessage: (newMsg) => {
        setMessages((prev) => {
          const exists = prev.findIndex((m) => m.id === newMsg.id);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });
      },
      onRoomEnded: (endedBy) => {
        if (endedBy !== currentUser.uid) {
          setIsOpponentDisconnected(true);
        }
      },
      onTypingTelemetry: (_opponentUid, isTyping, backspaces) => {
        setOpponentTyping({ isTyping, backspaces });
      },
    });

    return () => {
      unsubscribe();
      leaveChatRoom(roomId, currentUser.uid).catch(() => {});
    };
  }, [roomId, currentUser.uid]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, opponentTyping.isTyping]);

  // Handle typing telemetry
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    updateTypingTelemetry(roomId, currentUser.uid, true, backspaceCountRef.current).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingTelemetry(roomId, currentUser.uid, false, backspaceCountRef.current).catch(() => {});
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      backspaceCountRef.current += 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    backspaceCountRef.current = 0;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await sendChatMessage(roomId, currentUser.uid, text);
  };

  // Double-tap or double-click to heart a message
  const handleDoubleTapMessage = async (msg: ChatMessage) => {
    await toggleMessageHeart(roomId, msg.id, Boolean(msg.hearted));
  };

  // Insert Savage Hinglish Line Roulette
  const handleRandomSavageLine = () => {
    const randomPick = SAVAGE_HINGLISH_LINES[Math.floor(Math.random() * SAVAGE_HINGLISH_LINES.length)];
    setInputText(randomPick);
  };

  // Trigger Skip / Next with "KHATAM HO GAYA BHAIYA MATTER!" Reveal
  const handleTriggerNext = async () => {
    await leaveChatRoom(roomId, currentUser.uid).catch(() => {});

    const actualRole: SecretIdentity = opponent.secretIdentity || 'normal';
    const isCorrect = userGuess === actualRole;
    const xpGained = isCorrect ? 50 : 0;

    setRevealScore({
      isCorrect,
      xpGained,
      trueRole: actualRole,
    });
    setShowTruthReveal(true);
    setTruthCountdown(3);

    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      setTruthCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onNextMatch({ xpGained, isCorrect });
      }
    }, 1000);
  };

  return (
    <div className="relative z-10 w-full max-w-lg mx-auto px-3 sm:px-4 py-3 sm:py-5 h-[88vh] max-h-[760px] flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.18)] flex flex-col flex-1 overflow-hidden"
      >
        {/* ========================================================
            INSTAGRAM HEADER: STORY RING AVATAR, GENDER & GUESS SWITCH
            ======================================================== */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-slate-100 bg-white/90 backdrop-blur-md flex items-center justify-between z-20">
          <button
            onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
            className="flex items-center gap-2.5 sm:gap-3 text-left group hover:opacity-90 transition-opacity"
          >
            <div className="p-0.5 rounded-full insta-story-ring">
              <div className="w-10 h-10 rounded-full bg-white p-0.5">
                <img
                  src={opponent.avatar}
                  alt={opponent.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                  {opponent.username}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {isProfileDrawerOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <span>{opponent.displayName}</span>
                <span>•</span>
                <span className="uppercase font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 text-[10px]">
                  {opponent.presentedGender}
                </span>
              </div>
            </div>
          </button>

          {/* Live Guess Switch: Toggle between ✨ Normal & 🎣 Catfisher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs shadow-inner">
            <button
              onClick={() => setUserGuess('normal')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all ${
                userGuess === 'normal'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✨ Normal
            </button>
            <button
              onClick={() => setUserGuess('catfisher')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all ${
                userGuess === 'catfisher'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎣 Catfisher
            </button>
          </div>
        </div>

        {/* ========================================================
            EXPANDABLE MINI-BIO STRIP (Bio + Vibe Pills)
            ======================================================== */}
        <AnimatePresence>
          {isProfileDrawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50/95 border-b border-slate-200 px-4 py-2.5 text-xs overflow-hidden z-10"
            >
              <div className="font-semibold text-slate-800 italic">
                "{opponent.bio || 'Yahan imaandari chalta hai babu ✨'}"
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {opponent.vibes?.map((v, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 bg-white rounded-full border border-slate-200 text-[10px] font-black text-slate-700 shadow-2xs"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disconnect Banner if Opponent Ended */}
        {isOpponentDisconnected && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{opponent.username} has cut the line & disconnected.</span>
            </div>
            <button
              onClick={handleTriggerNext}
              className="font-extrabold underline text-rose-800 hover:text-rose-950"
            >
              Next Machhli →
            </button>
          </div>
        )}

        {/* ========================================================
            INSTAGRAM DM MESSAGE STREAM
            ======================================================== */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3">
          <div className="text-center py-1">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
              Connected in the Pond • Double-tap to Heart ❤️
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderUid === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  onDoubleClick={() => handleDoubleTapMessage(msg)}
                  className="relative group cursor-pointer max-w-[82%] sm:max-w-[75%]"
                >
                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-transform active:scale-[0.98] ${
                      isMe
                        ? 'insta-chat-gradient text-white rounded-br-xs'
                        : 'bg-[#F3F4F6] text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Double-tap Heart Badge */}
                  {msg.hearted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [0, 1.4, 1], rotate: 0 }}
                      className={`absolute -bottom-2 ${
                        isMe ? '-left-2' : '-right-2'
                      } bg-white rounded-full p-1 shadow border border-slate-100 text-xs`}
                    >
                      ❤️
                    </motion.div>
                  )}
                </div>

                {isMe && (
                  <span className="text-[9px] text-slate-400 mt-0.5 pr-1 font-semibold">
                    Seen just now
                  </span>
                )}
              </div>
            );
          })}

          {/* Typing Telemetry: 3-Dot Bouncing Pill */}
          {opponentTyping.isTyping && (
            <div className="flex items-center gap-2">
              <div className="bg-[#F3F4F6] px-3.5 py-2 rounded-2xl rounded-bl-xs inline-flex items-center gap-1 shadow-sm">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
              </div>

              {/* Psychological Rewrite Detector (when backspaces > 8) */}
              {opponentTyping.backspaces > 8 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  👀 @{opponent.username} deleted & rewrote their message...
                </span>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Psychological Rewrite Detector Alert above input bar if backspaces > 8 */}
        {opponentTyping.backspaces > 8 && (
          <div className="px-4 py-1 bg-amber-50 border-t border-amber-200 text-[10px] font-black text-amber-800 flex items-center justify-between">
            <span>👀 @{opponent.username} deleted & rewrote their message...</span>
            <span>{opponentTyping.backspaces} backspaces</span>
          </div>
        )}

        {/* ========================================================
            BOTTOM BAR: NEXT BUTTON + INSTA PILL INPUT + SAVAGE DICE
            ======================================================== */}
        <div className="p-3 border-t border-slate-100 bg-white/95 flex items-center gap-2">
          {/* Coral NEXT (Cut Line) Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTriggerNext}
            title="Cut line & skip to next match"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/25 transition-all flex-shrink-0"
          >
            <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>NEXT</span>
          </motion.button>

          {/* Rounded Instagram Pill Input with "🎲 Savage Hinglish Line" Roulette */}
          <div className="flex-1 relative flex items-center">
            <button
              onClick={handleRandomSavageLine}
              title="🎲 Savage Hinglish Line"
              type="button"
              className="absolute left-2 p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors z-10"
            >
              <Dices className="w-4 h-4 text-indigo-600" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${opponent.username}...`}
              className="w-full pl-9 pr-10 py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white rounded-full text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
            />

            {inputText.trim() && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="absolute right-1.5 p-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </motion.button>
            )}
          </div>
        </div>

        {/* ========================================================
            3-SECOND "KHATAM HO GAYA BHAIYA MATTER!" TRUTH REVEAL
            ======================================================== */}
        <AnimatePresence>
          {showTruthReveal && revealScore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-2 border-slate-200"
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-3.5 flex items-center justify-center text-3xl shadow-md border-2 border-slate-200 bg-slate-50">
                  {revealScore.isCorrect ? '🎯' : '🎣'}
                </div>

                <div className="text-[12px] font-black uppercase tracking-wider text-rose-600 mb-1">
                  KHATAM HO GAYA BHAIYA MATTER! 👋
                </div>

                <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-snug">
                  @{opponent.username} WAS{' '}
                  <span
                    className={
                      revealScore.trueRole === 'catfisher'
                        ? 'text-rose-600 uppercase font-black'
                        : 'text-sky-600 uppercase font-black'
                    }
                  >
                    {revealScore.trueRole === 'catfisher' ? 'CATFISHER 🎭 (Pura Golmaal!)' : 'NORMAL ✨ (100% Asli!)'}
                  </span>
                </h3>

                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Your guess was: <strong className="capitalize text-slate-800">{userGuess}</strong>
                </p>

                {/* Score Banner */}
                <div
                  className={`mt-4 p-3 rounded-2xl flex items-center justify-center gap-2 ${
                    revealScore.isCorrect
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {revealScore.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-black text-xs sm:text-sm">
                        🎉 BINGO! SAHI PEHCHANA! +50 XP
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span className="font-black text-xs sm:text-sm">
                        🎣 GOLMAAL MEIN FAS GAYE! +0 XP
                      </span>
                    </>
                  )}
                </div>

                {/* 3-Second Countdown Progress */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-500 mb-1.5">
                    Casting next line in {truthCountdown}s...
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 3, ease: 'linear' }}
                      className="bg-teal-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
