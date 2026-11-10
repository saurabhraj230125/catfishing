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
  setMessageReaction,
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
  XCircle,
  ShieldAlert,
  Smile,
  Sparkles
} from 'lucide-react';

interface InstaPondChatProps {
  roomId: string;
  currentUser: UserProfile;
  opponent: PublicPondProfile;
  onNextMatch: (reward: { xpGained: number; isCorrect: boolean }) => void;
  onExit: () => void;
}

const QUICK_REACTION_EMOJIS = ['❤️', '😂', '💀', '🔥', '🚩', '🧢', '🎣'];

const QUICK_INPUT_EMOJIS = ['❤️', '😂', '💀', '🔥', '🚩', '🧢', '👀', '🎣', '☕', '✨', '😭', '🙏'];

const SAVAGE_HINGLISH_LINES = [
  "Aap mujhe pehle nahi mile, warna aapko hi bana leti 👀",
  "Accha aapka BF/GF accha nahi hai kya? 💀",
  "Mera ex thoda rude tha aur kamata bhi nahi tha 😭",
  "Kisne follow kiya? Maine Bhagwan ke raah ko follow kiya hai 🙏",
  "Catfish test: What was your 10th board school city? 📚",
  "Number de apna? 992... baaki aapki marzi 📞",
  "Bhai tera katega ganda wala, SS bheju kya? 🔥",
  "Aapne khana khaya? (Tone suddenly changed 👀)",
  "Pani Puri, Golgappa, ya Puchka? Sahi choice se character pata chalta hai! 💥",
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
  const [showEmojiPickerForMsg, setShowEmojiPickerForMsg] = useState<string | null>(null);
  const [showQuickEmojiBar, setShowQuickEmojiBar] = useState(true);

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
    await toggleMessageHeart(roomId, msg.id, Boolean(msg.hearted || msg.reaction === '❤️'));
  };

  // Add emoji reaction to message
  const handleSelectReaction = async (msgId: string, emoji: string) => {
    setShowEmojiPickerForMsg(null);
    await setMessageReaction(roomId, msgId, emoji);
  };

  // Append emoji to input text
  const handleAppendEmoji = (emoji: string) => {
    setInputText((prev) => `${prev}${emoji}`);
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
    <div className="relative z-10 w-full max-w-lg mx-auto px-2 sm:px-4 py-1 sm:py-3 h-[calc(100dvh-60px)] sm:h-[84dvh] max-h-[760px] flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.18)] flex flex-col flex-1 overflow-hidden"
      >
        {/* ========================================================
            HEADER: STORY RING AVATAR, USERNAME & GUESS SWITCH
            ======================================================== */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-slate-100 bg-white/90 backdrop-blur-md flex items-center justify-between z-20">
          <button
            onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 text-left group hover:opacity-90 transition-opacity"
          >
            <div className="p-0.5 rounded-full insta-story-ring flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-white p-0.5">
                <img
                  src={opponent.avatar}
                  alt={opponent.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-slate-900 tracking-tight truncate max-w-[120px] sm:max-w-[160px]">
                  {opponent.username}
                </span>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {isProfileDrawerOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold truncate">
                <span>{opponent.displayName}</span>
                <span>•</span>
                <span className="uppercase font-bold text-teal-800 bg-teal-50 px-1 py-0.2 rounded border border-teal-200 text-[9px]">
                  {opponent.presentedGender}
                </span>
              </div>
            </div>
          </button>

          {/* Live Guess Switch: Toggle between ✨ Normal & 🎣 Catfisher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs shadow-inner flex-shrink-0">
            <button
              onClick={() => setUserGuess('normal')}
              type="button"
              className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black transition-all ${
                userGuess === 'normal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Guess: Real Stranger"
            >
              ✨ Asli
            </button>
            <button
              onClick={() => setUserGuess('catfisher')}
              type="button"
              className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black transition-all ${
                userGuess === 'catfisher'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Guess: Fake / Catfisher"
            >
              🎭 Catfish
            </button>
          </div>
        </div>

        {/* ========================================================
            SAFETY WARNING BANNER (Requested by User)
            ======================================================== */}
        <div className="bg-amber-50/95 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-900 font-semibold z-10 shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">
              ⚠️ <strong>Safe Chat Alert:</strong> Do not share personal information (Phone, UPI, Address, Socials). Chat at your own risk!
            </span>
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
              className="bg-slate-50/95 border-b border-slate-200 px-3 sm:px-4 py-2 text-xs overflow-hidden z-10"
            >
              <div className="font-semibold text-slate-800 italic text-[11px] sm:text-xs">
                "{opponent.bio || 'Yahan imaandari chalta hai babu ✨'}"
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {opponent.vibes?.map((v, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white rounded-full border border-slate-200 text-[10px] font-black text-slate-700 shadow-2xs"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disconnect Banner if Opponent Left */}
        {isOpponentDisconnected && (
          <div className="bg-rose-50 border-b border-rose-200 px-3 py-1.5 flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>{opponent.username} has cut the line & disconnected.</span>
            </div>
            <button
              onClick={handleTriggerNext}
              type="button"
              className="font-extrabold underline text-rose-800 hover:text-rose-950 ml-2"
            >
              Next →
            </button>
          </div>
        )}

        {/* ========================================================
            MESSAGE STREAM
            ======================================================== */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5">
          <div className="text-center py-1">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100/90 px-3 py-0.5 rounded-full uppercase tracking-wider">
              Connected in the Pond • Double-tap to React
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderUid === currentUser.uid;
            const currentReaction = msg.reaction || (msg.hearted ? '❤️' : null);

            return (
              <div
                key={msg.id}
                className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  onDoubleClick={() => handleDoubleTapMessage(msg)}
                  className="relative cursor-pointer max-w-[85%] sm:max-w-[78%]"
                >
                  {/* Message Bubble */}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-transform active:scale-[0.98] ${
                      isMe
                        ? 'insta-chat-gradient text-white rounded-br-xs'
                        : 'bg-[#F3F4F6] text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Reaction Pill Badge */}
                  {currentReaction && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                      className={`absolute -bottom-2 ${
                        isMe ? '-left-2' : '-right-2'
                      } bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-slate-200 text-xs flex items-center justify-center`}
                    >
                      {currentReaction}
                    </motion.div>
                  )}

                  {/* Reaction Picker Button on Hover / Click */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPickerForMsg(showEmojiPickerForMsg === msg.id ? null : msg.id);
                    }}
                    className={`absolute -top-3 ${
                      isMe ? '-left-6' : '-right-6'
                    } opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-[10px] shadow-sm`}
                    title="Add reaction"
                  >
                    <Smile className="w-3 h-3 text-slate-500" />
                  </button>

                  {/* Quick Reaction Popup Menu */}
                  {showEmojiPickerForMsg === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`absolute bottom-full mb-1 ${
                        isMe ? 'right-0' : 'left-0'
                      } z-30 bg-white rounded-full p-1 border border-slate-200 shadow-lg flex items-center gap-1`}
                    >
                      {QUICK_REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelectReaction(msg.id, emoji)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-sm transition-transform hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {isMe && (
                  <span className="text-[9px] text-slate-400 mt-0.5 pr-1 font-semibold">
                    Seen
                  </span>
                )}
              </div>
            );
          })}

          {/* Typing Telemetry: 3-Dot Bouncing Pill */}
          {opponentTyping.isTyping && (
            <div className="flex items-center gap-2">
              <div className="bg-[#F3F4F6] px-3 py-1.5 rounded-2xl rounded-bl-xs inline-flex items-center gap-1 shadow-2xs">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
              </div>

              {/* Psychological Rewrite Detector (when backspaces > 6) */}
              {opponentTyping.backspaces > 6 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  👀 @{opponent.username} erased text ({opponentTyping.backspaces} backspaces)...
                </span>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Psychological Rewrite Alert above input bar if backspaces > 6 */}
        {opponentTyping.backspaces > 6 && (
          <div className="px-3 py-1 bg-amber-50 border-t border-amber-200 text-[10px] font-black text-amber-800 flex items-center justify-between">
            <span>👀 Telemetry: @{opponent.username} erased and rewrote draft...</span>
            <span className="font-mono">{opponentTyping.backspaces} edits</span>
          </div>
        )}

        {/* ========================================================
            QUICK EMOJI BAR (Requested by User)
            ======================================================== */}
        <div className="px-2.5 py-1 bg-slate-50/90 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 flex-shrink-0">
            <Smile className="w-3 h-3 text-slate-400" />
            <span>Emojis:</span>
          </span>
          {QUICK_INPUT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAppendEmoji(emoji)}
              className="text-sm px-1 py-0.5 hover:scale-125 transition-transform flex-shrink-0"
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* ========================================================
            BOTTOM BAR: NEXT BUTTON + PILL INPUT + SAVAGE DICE
            ======================================================== */}
        <div className="p-2 sm:p-3 border-t border-slate-100 bg-white flex items-center gap-2">
          {/* Coral NEXT (Cut Line) Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleTriggerNext}
            title="Cut line & skip to next match"
            type="button"
            className="flex items-center gap-1 px-3 py-2 sm:py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all flex-shrink-0"
          >
            <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>NEXT</span>
          </motion.button>

          {/* Rounded Instagram Pill Input with "🎲 Savage Line" Roulette */}
          <div className="flex-1 relative flex items-center">
            <button
              onClick={handleRandomSavageLine}
              title="🎲 Savage Icebreaker Roulette"
              type="button"
              className="absolute left-2 p-1 rounded-full hover:bg-slate-200 text-slate-600 transition-colors z-10"
            >
              <Dices className="w-4 h-4 text-indigo-600" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${opponent.username}...`}
              className="w-full pl-8 pr-10 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white rounded-full text-base sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium touch-manipulation"
            />

            {inputText.trim() && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                type="button"
                className="absolute right-1.5 p-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
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
              className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-white text-center"
            >
              <motion.div
                initial={{ scale: 0.85, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 max-w-sm w-full shadow-2xl border-2 border-slate-200"
              >
                <div className="w-14 h-14 rounded-full mx-auto mb-2.5 flex items-center justify-center text-3xl shadow-md border-2 border-slate-200 bg-slate-50">
                  {revealScore.isCorrect ? '🎯' : '🎣'}
                </div>

                <div className="text-[11px] font-black uppercase tracking-wider text-rose-600 mb-0.5">
                  KHATAM HO GAYA BHAIYA MATTER! 👋
                </div>

                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-snug">
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

                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                  Your guess was: <strong className="capitalize text-slate-800">{userGuess}</strong>
                </p>

                {/* Score Banner */}
                <div
                  className={`mt-3.5 p-2.5 rounded-2xl flex items-center justify-center gap-2 ${
                    revealScore.isCorrect
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {revealScore.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-black text-xs">
                        🎉 BINGO! SAHI PEHCHANA! +50 XP
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span className="font-black text-xs">
                        🎣 GOLMAAL MEIN FAS GAYE! +0 XP
                      </span>
                    </>
                  )}
                </div>

                {/* 3-Second Countdown Progress */}
                <div className="mt-4 pt-2.5 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">
                    Next line casting in {truthCountdown}s...
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
