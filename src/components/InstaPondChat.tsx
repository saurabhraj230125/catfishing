'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserProfile, 
  PublicPondProfile, 
  ChatMessage, 
  SecretIdentity,
  ChatSession 
} from '@/types/pond';
import {
  subscribeToChatRoom,
  sendChatMessage,
  toggleMessageHeart,
  setMessageReaction,
  updateTypingTelemetry,
  leaveChatRoom,
} from '@/lib/matchmaker';
import { getGuaranteedBotFallback } from '@/lib/botPersonas';
import { useChatTimer } from '@/hooks/useChatTimer';
import { PricingModal } from '@/components/PricingModal';
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
  Clock
} from 'lucide-react';
import {
  playMessageSendSound,
  playMessageReceiveSound,
  playReactionSound,
  playDiceRollSound,
  playVictorySound,
  playCatfishBuzzerSound,
  triggerHaptic,
} from '@/lib/soundEffects';
import { trackEvent } from '@/lib/analytics';

interface InstaPondChatProps {
  activeSession: ChatSession;
  currentUser: UserProfile;
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
  activeSession,
  currentUser,
  onNextMatch,
  onExit,
}: InstaPondChatProps) {
  const roomId = activeSession.roomId;
  const isBot = activeSession.type === 'bot';

  // Partner display projection
  const opponent: PublicPondProfile =
    activeSession.type === 'bot'
      ? {
          uid: `stealth_${activeSession.partner.username}`,
          displayName: activeSession.partner.displayName,
          username: activeSession.partner.username,
          avatar: activeSession.partner.avatar,
          bio: activeSession.partner.bio,
          vibes: activeSession.partner.vibes,
          presentedGender: activeSession.partner.presentedGender,
          secretIdentity: activeSession.partner.secretRole,
        }
      : activeSession.partner;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [opponentTyping, setOpponentTyping] = useState<{ isTyping: boolean; backspaces: number }>({
    isTyping: false,
    backspaces: 0,
  });
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [showEmojiPickerForMsg, setShowEmojiPickerForMsg] = useState<string | null>(null);

  // Live Guess Switch (Top Right): ✨ Normal vs 🎣 Catfisher
  const [userGuess, setUserGuess] = useState<SecretIdentity>('normal');

  // Keystroke & telemetry refs
  const backspaceCountRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Bot choreography & debounce refs
  const botDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const botTypingTimersRef = useRef<NodeJS.Timeout[]>([]);
  const botAbortControllerRef = useRef<AbortController | null>(null);
  const queuedUserMsgsRef = useRef<string[]>([]);

  // 3-Second "KHATAM HO GAYA BHAIYA MATTER!" Truth Reveal Overlay state
  const [showTruthReveal, setShowTruthReveal] = useState(false);
  const [truthCountdown, setTruthCountdown] = useState(3);
  const [revealScore, setRevealScore] = useState<{
    isCorrect: boolean;
    xpGained: number;
    trueRole: SecretIdentity;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Modal state for minutes upgrade / refill
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const openPricingModal = () => setIsPricingModalOpen(true);
  const closePricingModal = () => setIsPricingModalOpen(false);

  // 5-Minute Live Chat Session & Quota Timer
  const {
    formattedTime,
    isExpired,
    isUnlimited,
    urgencyLevel,
    planTier,
    refreshSubscription,
  } = useChatTimer({
    userUid: currentUser.uid,
    userEmail: currentUser.email,
    isActive: !isOpponentDisconnected && !showTruthReveal,
    onTimeExpired: () => {
      setIsPricingModalOpen(true);
    },
  });

  // 1. DECOUPLED FIRESTORE LISTENER (Guarded strictly for human sessions only)
  useEffect(() => {
    // CRITICAL BUG FIX: Never attach Firestore listeners to bot sessions
    if (!activeSession || activeSession.type === 'bot') return;

    const unsubscribe = subscribeToChatRoom(roomId, currentUser.uid, {
      onMessage: (newMsg) => {
        setMessages((prev) => {
          const exists = prev.findIndex((m) => m.id === newMsg.id);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = newMsg;
            return updated;
          }
          if (newMsg.senderUid !== currentUser.uid) {
            playMessageReceiveSound();
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
  }, [roomId, currentUser.uid, activeSession]);

  // 2. STEALTH BOT OPENER (Natural 55% chance drop)
  useEffect(() => {
    if (!activeSession || activeSession.type !== 'bot') return;
    const botPersona = activeSession.partner;

    const shouldOpen = Math.random() < 0.55;
    if (shouldOpen) {
      const openers =
        botPersona.presentedGender === 'girl'
          ? ['heyy :)', 'kya scene?', 'heyy kahan se ho?', 'sup', 'heyy']
          : ['yo', 'sup bro', 'kya scene?', 'heyy', 'kahan se ho?'];
      const randomOpener = openers[Math.floor(Math.random() * openers.length)];
      const delay = 1300 + Math.random() * 1100;

      const timer = setTimeout(() => {
        setOpponentTyping({ isTyping: true, backspaces: 0 });
        const typingDelay = setTimeout(() => {
          setOpponentTyping({ isTyping: false, backspaces: 0 });
          const newMsg: ChatMessage = {
            id: `msg_stealth_${Date.now()}`,
            senderUid: opponent.uid,
            text: randomOpener,
            hearted: false,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, newMsg]);
          playMessageReceiveSound();
        }, 750 + Math.random() * 400);
        botTypingTimersRef.current.push(typingDelay);
      }, delay);

      botTypingTimersRef.current.push(timer);
    }

    return () => {
      if (botDebounceRef.current) clearTimeout(botDebounceRef.current);
      botTypingTimersRef.current.forEach((t) => clearTimeout(t));
      botTypingTimersRef.current = [];
      if (botAbortControllerRef.current) {
        botAbortControllerRef.current.abort();
      }
    };
  }, [activeSession, opponent.uid]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, opponentTyping.isTyping]);

  // 3. EXECUTE BOT REPLY PIPELINE (With 10s AbortController and instant Hinglish fallback)
  const executeBotReply = async (
    userText: string,
    currentHistory: ChatMessage[],
    userMsgId: string
  ) => {
    if (activeSession.type !== 'bot') return;
    const botPersona = activeSession.partner;

    if (botAbortControllerRef.current) {
      botAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    botAbortControllerRef.current = abortController;

    const pauseTimer = setTimeout(() => {
      setOpponentTyping({ isTyping: true, backspaces: 0 });
    }, 450);
    botTypingTimersRef.current.push(pauseTimer);

    let replyData: {
      messages: string[];
      shouldHeartLastUserMsg: boolean;
      simulateRewrite: boolean;
    };

    try {
      const historyPayload = currentHistory.slice(-8).map((m) => ({
        sender: (m.senderUid === currentUser.uid ? 'user' : 'partner') as 'user' | 'partner',
        text: m.text,
      }));

      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      const res = await fetch('/api/stealth-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: botPersona,
          userGender: currentUser.presentedGender,
          messages: historyPayload,
          userMessage: userText,
        }),
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const bubbles = Array.isArray(json.messages) && json.messages.length > 0
          ? json.messages
          : Array.isArray(json.bubbles) && json.bubbles.length > 0
          ? json.bubbles
          : null;

        if (bubbles) {
          replyData = {
            messages: bubbles,
            shouldHeartLastUserMsg: Boolean(json.shouldHeartLastUserMsg),
            simulateRewrite: Boolean(json.simulateRewrite),
          };
        } else {
          replyData = getGuaranteedBotFallback(userText, botPersona);
        }
      } else {
        replyData = getGuaranteedBotFallback(userText, botPersona);
      }
    } catch {
      replyData = getGuaranteedBotFallback(userText, botPersona);
    }

    if (abortController.signal.aborted) return;

    // Simulated backspace rewrite tell if flagged
    if (replyData.simulateRewrite) {
      setOpponentTyping({ isTyping: true, backspaces: 8 });
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));
    }

    // Deliver bubbles sequentially
    for (let i = 0; i < replyData.messages.length; i++) {
      if (abortController.signal.aborted) return;

      const bubble = replyData.messages[i];
      setOpponentTyping({ isTyping: true, backspaces: 0 });
      await new Promise((r) => setTimeout(r, 550 + Math.random() * 500));

      setOpponentTyping({ isTyping: false, backspaces: 0 });
      const newBotMsg: ChatMessage = {
        id: `bot_msg_${Date.now()}_${i}`,
        senderUid: opponent.uid,
        text: bubble,
        hearted: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, newBotMsg]);
      playMessageReceiveSound();

      if (i < replyData.messages.length - 1) {
        await new Promise((r) => setTimeout(r, 350 + Math.random() * 300));
      }
    }

    // Double-tap heart user's last message if flagged
    if (replyData.shouldHeartLastUserMsg) {
      const heartTimer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId ? { ...m, hearted: true, reaction: '❤️' } : m
          )
        );
        playReactionSound();
      }, 700);
      botTypingTimersRef.current.push(heartTimer);
    }
  };

  // 4. INSTANT OPTIMISTIC SEND + 900ms DEBOUNCED QUEUE
  const handleSend = () => {
    if (!inputText.trim() || isExpired || isOpponentDisconnected) return;
    const text = inputText.trim();
    setInputText('');
    backspaceCountRef.current = 0;

    playMessageSendSound();
    trackEvent('chat_message_sent', { roomId });

    const userMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      senderUid: currentUser.uid,
      text,
      hearted: false,
      createdAt: new Date(),
    };

    // Instant optimistic UI update: never lag or wait
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    if (activeSession.type === 'bot') {
      queuedUserMsgsRef.current.push(text);

      // Cancel previous debounce timer and restart fresh 900ms
      if (botDebounceRef.current) {
        clearTimeout(botDebounceRef.current);
      }

      botDebounceRef.current = setTimeout(() => {
        const combined = queuedUserMsgsRef.current.join(' \n ');
        queuedUserMsgsRef.current = [];
        executeBotReply(combined, nextHistory, userMsgId);
      }, 900);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendChatMessage(roomId, currentUser.uid, text).catch(() => {});
    }
  };

  // Typing telemetry for real-human chat
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isExpired || isOpponentDisconnected) return;
    setInputText(e.target.value);

    if (activeSession.type === 'human') {
      updateTypingTelemetry(roomId, currentUser.uid, true, backspaceCountRef.current).catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingTelemetry(roomId, currentUser.uid, false, backspaceCountRef.current).catch(() => {});
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isExpired || isOpponentDisconnected) return;
    if (e.key === 'Backspace') {
      backspaceCountRef.current += 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Double-tap or double-click to heart a message
  const handleDoubleTapMessage = async (msg: ChatMessage) => {
    playReactionSound();
    trackEvent('chat_message_hearted');

    if (activeSession.type === 'bot') {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, hearted: !m.hearted, reaction: !m.hearted ? '❤️' : undefined }
            : m
        )
      );
      return;
    }

    await toggleMessageHeart(roomId, msg.id, Boolean(msg.hearted || msg.reaction === '❤️'));
  };

  // Add emoji reaction to message
  const handleSelectReaction = async (msgId: string, emoji: string) => {
    playReactionSound();
    setShowEmojiPickerForMsg(null);
    trackEvent('chat_reaction_selected', { emoji });

    if (activeSession.type === 'bot') {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, reaction: emoji, hearted: emoji === '❤️' } : m
        )
      );
      return;
    }

    await setMessageReaction(roomId, msgId, emoji);
  };

  const handleAppendEmoji = (emoji: string) => {
    if (isExpired || isOpponentDisconnected) return;
    triggerHaptic('light');
    setInputText((prev) => `${prev}${emoji}`);
  };

  const handleRandomSavageLine = () => {
    if (isExpired || isOpponentDisconnected) return;
    playDiceRollSound();
    trackEvent('chat_savage_line_roulette');
    const randomPick = SAVAGE_HINGLISH_LINES[Math.floor(Math.random() * SAVAGE_HINGLISH_LINES.length)];
    setInputText(randomPick);
  };

  // Trigger Skip / Next with "KHATAM HO GAYA BHAIYA MATTER!" Reveal
  const handleTriggerNext = async () => {
    // Clear all bot timeouts immediately so old replies never leak into next room
    if (botDebounceRef.current) clearTimeout(botDebounceRef.current);
    botTypingTimersRef.current.forEach((t) => clearTimeout(t));
    botTypingTimersRef.current = [];
    if (botAbortControllerRef.current) {
      botAbortControllerRef.current.abort();
    }
    queuedUserMsgsRef.current = [];

    if (activeSession.type === 'human') {
      await leaveChatRoom(roomId, currentUser.uid).catch(() => {});
    }

    const actualRole: SecretIdentity =
      activeSession.type === 'bot'
        ? activeSession.partner.secretRole
        : activeSession.partner.secretIdentity || 'normal';
    const isCorrect = userGuess === actualRole;
    const xpGained = isCorrect ? 50 : 0;

    trackEvent('chat_truth_revealed', { isCorrect, guess: userGuess, actualRole });

    if (isCorrect) {
      playVictorySound();
    } else {
      playCatfishBuzzerSound();
    }

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
            HEADER: STORY RING AVATAR, TIMER PILL & GUESS SWITCH
            ======================================================== */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-white/90 backdrop-blur-md flex items-center justify-between gap-1.5 z-20">
          <button
            onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
            type="button"
            className="flex items-center gap-2 text-left group hover:opacity-90 transition-opacity min-w-0 cursor-pointer"
          >
            <div className="p-0.5 rounded-full insta-story-ring flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white p-0.5">
                <img
                  src={opponent.avatar}
                  alt={opponent.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm text-slate-900 tracking-tight truncate max-w-[90px] sm:max-w-[130px]">
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

          {/* Right Header Side: Live Session Timer + Live Guess Switch */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Live 5-Minute / Quota Countdown Timer */}
            <button
              type="button"
              onClick={openPricingModal}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black transition-all shadow-xs cursor-pointer border ${
                urgencyLevel === 'critical'
                  ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                  : urgencyLevel === 'low'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : isUnlimited
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
              }`}
              title="Angler Minutes Timer - Click to refill / upgrade"
            >
              <Clock className="w-3 h-3 text-teal-600 flex-shrink-0" />
              <span className="font-mono">{formattedTime}</span>
              {!isUnlimited && (
                <span className="hidden sm:inline text-[9px] font-black text-teal-700 bg-white/80 px-1 rounded">
                  +
                </span>
              )}
            </button>

            {/* Live Guess Switch: Toggle between ✨ Normal & 🎣 Catfisher */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-full border border-slate-200 text-xs shadow-inner">
              <button
                onClick={() => {
                  setUserGuess('normal');
                  playReactionSound();
                }}
                type="button"
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${
                  userGuess === 'normal'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Guess: Real Stranger"
              >
                ✨ Asli
              </button>
              <button
                onClick={() => {
                  setUserGuess('catfisher');
                  playReactionSound();
                }}
                type="button"
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${
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
        </div>

        {/* Safety Warning Banner */}
        <div className="bg-amber-50/95 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-900 font-semibold z-10 shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">
              ⚠️ <strong>Safe Chat Alert:</strong> Do not share personal information (Phone, UPI, Address, Socials). Chat at your own risk!
            </span>
          </div>
        </div>

        {/* Expandable Mini-Bio Strip */}
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
              className="font-extrabold underline text-rose-800 hover:text-rose-950 ml-2 cursor-pointer"
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

        {/* Quick Emoji Bar */}
        <div className="px-2.5 py-1 bg-slate-50/90 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 flex-shrink-0">
            <Smile className="w-3 h-3 text-slate-400" />
            <span>Emojis:</span>
          </span>
          {QUICK_INPUT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={isExpired || isOpponentDisconnected}
              onClick={() => handleAppendEmoji(emoji)}
              className="text-sm px-1 py-0.5 hover:scale-125 transition-transform flex-shrink-0 cursor-pointer disabled:opacity-40"
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Quota Expired Alert Banner */}
        {isExpired && (
          <div className="bg-rose-50 border-t border-rose-200 px-3 py-2 flex items-center justify-between text-xs font-black text-rose-800 z-10 shadow-xs">
            <span className="truncate">⏰ Angler Minutes Finished (00:00)! Refill to chat.</span>
            <button
              type="button"
              onClick={openPricingModal}
              className="ml-2 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black shadow-xs whitespace-nowrap cursor-pointer transition-all"
            >
              Refill Minutes →
            </button>
          </div>
        )}

        {/* ========================================================
            BOTTOM BAR: NEXT BUTTON + PILL INPUT + SAVAGE DICE
            NEVER DISABLES INPUT WHILE BOT IS TYPING
            ======================================================== */}
        <div className="p-2 sm:p-3 border-t border-slate-100 bg-white flex items-center gap-2">
          {/* Coral NEXT (Cut Line) Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleTriggerNext}
            title="Cut line & skip to next match"
            type="button"
            className="flex items-center gap-1 px-3 py-2 sm:py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all flex-shrink-0 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>NEXT</span>
          </motion.button>

          {/* Rounded Instagram Pill Input */}
          <div className="flex-1 relative flex items-center">
            <button
              onClick={handleRandomSavageLine}
              disabled={isExpired || isOpponentDisconnected}
              title="🎲 Savage Icebreaker Roulette"
              type="button"
              className={`absolute left-2 p-1 rounded-full text-slate-600 transition-colors z-10 ${
                isExpired || isOpponentDisconnected ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-200 cursor-pointer'
              }`}
            >
              <Dices className="w-4 h-4 text-indigo-600" />
            </button>

            <input
              type="text"
              value={inputText}
              disabled={isExpired || isOpponentDisconnected}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isExpired
                  ? '⏰ Angler quota expired! Refill to continue...'
                  : isOpponentDisconnected
                  ? 'Opponent has cut the line. Tap NEXT to rematch.'
                  : `Message ${opponent.username}...`
              }
              className={`w-full pl-8 pr-10 py-2 sm:py-2.5 rounded-full text-base sm:text-sm text-slate-900 border transition-all font-medium touch-manipulation ${
                isExpired || isOpponentDisconnected
                  ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200/60 focus:bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
              }`}
            />

            {inputText.trim() && !isExpired && !isOpponentDisconnected && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                type="button"
                className="absolute right-1.5 p-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs cursor-pointer"
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

      {/* 3-Tier Monthly Subscription Modal with Direct UPI Checkout */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={closePricingModal}
        userUid={currentUser.uid}
        userEmail={currentUser.email}
        currentPlan={planTier}
        partnerHandle={opponent.username}
        onPlanUpgraded={() => refreshSubscription()}
        isExpiredPrompt={isExpired}
      />
    </div>
  );
}
