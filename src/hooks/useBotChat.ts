'use client';

import { useRef, useEffect, useCallback } from 'react';
import { StealthPersona, ChatMessage, UserProfile } from '@/types/pond';
import { getGuaranteedBotFallback } from '@/lib/botPersonas';
import { playMessageReceiveSound, playReactionSound } from '@/lib/soundEffects';

interface UseBotChatOptions {
  persona: StealthPersona | null;
  isActive: boolean;
  currentUser: UserProfile;
  onAddBotMessage: (msg: ChatMessage) => void;
  onSetOpponentTyping: (typing: { isTyping: boolean; backspaces: number }) => void;
  onHeartUserMessage: (msgId: string) => void;
  getHistory: () => ChatMessage[];
}

export function useBotChat({
  persona,
  isActive,
  currentUser,
  onAddBotMessage,
  onSetOpponentTyping,
  onHeartUserMessage,
  getHistory,
}: UseBotChatOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queuedMessagesRef = useRef<{ id: string; text: string }[]>([]);
  const isExecutingRef = useRef<boolean>(false);

  // Clear all pending timers and abort ongoing fetches
  const cancelAllPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current = [];
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    queuedMessagesRef.current = [];
    isExecutingRef.current = false;
    onSetOpponentTyping({ isTyping: false, backspaces: 0 });
  }, [onSetOpponentTyping]);

  // Clean up on unmount or when match ends
  useEffect(() => {
    return () => {
      cancelAllPending();
    };
  }, [cancelAllPending]);

  // Initial greeting opener (55% natural probability)
  useEffect(() => {
    if (!isActive || !persona) return;

    const shouldSendOpener = Math.random() < 0.55;
    if (!shouldSendOpener) return;

    const botOpeners =
      persona.openerPool && persona.openerPool.length > 0
        ? persona.openerPool
        : persona.presentedGender === 'girl'
        ? ['heyy :)', 'kya scene?', 'heyy kahan se ho?', 'sup', 'heyy']
        : ['yo', 'sup bro', 'kya scene?', 'heyy', 'kahan se ho?'];
    const selectedOpener = botOpeners[Math.floor(Math.random() * botOpeners.length)];
    const initialDelay = 1200 + Math.random() * 1000;

    const openerTimer = setTimeout(() => {
      onSetOpponentTyping({ isTyping: true, backspaces: 0 });

      const typingDuration = 700 + Math.random() * 500;
      const sendTimer = setTimeout(() => {
        onSetOpponentTyping({ isTyping: false, backspaces: 0 });
        const openerMsg: ChatMessage = {
          id: `stealth_msg_${Date.now()}_open`,
          senderUid: `stealth_${persona.username}`,
          text: selectedOpener,
          hearted: false,
          createdAt: new Date(),
        };
        onAddBotMessage(openerMsg);
        playMessageReceiveSound();
      }, typingDuration);

      activeTimersRef.current.push(sendTimer);
    }, initialDelay);

    activeTimersRef.current.push(openerTimer);

    return () => {
      clearTimeout(openerTimer);
    };
  }, [isActive, persona, onAddBotMessage, onSetOpponentTyping]);

  // Process queued user messages and trigger bot response
  const processQueue = useCallback(
    async (combinedText: string, lastUserMsgId: string) => {
      if (!persona || !isActive) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Start typing indicator quickly
      const pauseTimer = setTimeout(() => {
        if (!controller.signal.aborted) {
          onSetOpponentTyping({ isTyping: true, backspaces: 0 });
        }
      }, 400);
      activeTimersRef.current.push(pauseTimer);

      let replyData: {
        messages: string[];
        shouldHeartLastUserMsg: boolean;
        simulateRewrite: boolean;
      };

      try {
        const history = getHistory();
        const historyPayload = history.slice(-8).map((m) => ({
          sender: (m.senderUid === currentUser.uid ? 'user' : 'partner') as 'user' | 'partner',
          text: m.text,
        }));

        const timeoutTimer = setTimeout(() => controller.abort(), 7000);

        const res = await fetch('/api/stealth-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persona,
            userGender: currentUser.presentedGender,
            messages: historyPayload,
            userMessage: combinedText,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutTimer);

        if (res.ok) {
          const json = await res.json();
          const bubbles =
            Array.isArray(json.messages) && json.messages.length > 0
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
            replyData = getGuaranteedBotFallback(combinedText, persona);
          }
        } else {
          replyData = getGuaranteedBotFallback(combinedText, persona);
        }
      } catch {
        replyData = getGuaranteedBotFallback(combinedText, persona);
      }

      if (controller.signal.aborted) return;

      // Simulated backspaces rewrite tell if flagged
      if (replyData.simulateRewrite) {
        onSetOpponentTyping({ isTyping: true, backspaces: 8 });
        await new Promise((resolve) => {
          const t = setTimeout(resolve, 800 + Math.random() * 400);
          activeTimersRef.current.push(t);
        });
      }

      if (controller.signal.aborted) return;

      // Deliver bubbles sequentially
      for (let i = 0; i < replyData.messages.length; i++) {
        if (controller.signal.aborted) return;

        const bubbleText = replyData.messages[i];
        onSetOpponentTyping({ isTyping: true, backspaces: 0 });

        await new Promise((resolve) => {
          const t = setTimeout(resolve, 500 + Math.random() * 450);
          activeTimersRef.current.push(t);
        });

        if (controller.signal.aborted) return;

        onSetOpponentTyping({ isTyping: false, backspaces: 0 });
        const newBotMsg: ChatMessage = {
          id: `stealth_msg_${Date.now()}_${i}`,
          senderUid: `stealth_${persona.username}`,
          text: bubbleText,
          hearted: false,
          createdAt: new Date(),
        };
        onAddBotMessage(newBotMsg);
        playMessageReceiveSound();

        if (i < replyData.messages.length - 1) {
          await new Promise((resolve) => {
            const t = setTimeout(resolve, 350 + Math.random() * 250);
            activeTimersRef.current.push(t);
          });
        }
      }

      // Double-tap heart user's last message if flagged
      if (replyData.shouldHeartLastUserMsg && lastUserMsgId) {
        const heartTimer = setTimeout(() => {
          if (!controller.signal.aborted) {
            onHeartUserMessage(lastUserMsgId);
            playReactionSound();
          }
        }, 650);
        activeTimersRef.current.push(heartTimer);
      }

      isExecutingRef.current = false;
    },
    [
      persona,
      isActive,
      currentUser.uid,
      currentUser.presentedGender,
      getHistory,
      onSetOpponentTyping,
      onAddBotMessage,
      onHeartUserMessage,
    ]
  );

  // Called immediately when user sends a message
  const queueUserMessage = useCallback(
    (text: string, userMsgId: string) => {
      if (!isActive || !persona) return;

      queuedMessagesRef.current.push({ id: userMsgId, text });

      // Reset 850ms debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const queued = [...queuedMessagesRef.current];
        queuedMessagesRef.current = [];
        if (queued.length === 0) return;

        const combinedText = queued.map((q) => q.text).join(' \n ');
        const lastMsgId = queued[queued.length - 1].id;

        processQueue(combinedText, lastMsgId);
      }, 850);
    },
    [isActive, persona, processQueue]
  );

  return {
    queueUserMessage,
    cancelAllPending,
  };
}

