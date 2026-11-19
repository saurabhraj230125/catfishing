'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlanTier, UserSubscription } from '@/types/pond';
import {
  getUserSubscription,
  saveUserRemainingSeconds,
} from '@/lib/subscription';

interface UseChatTimerOptions {
  userUid: string;
  userEmail?: string;
  isActive: boolean;
  onTimeExpired?: () => void;
}

export type UrgencyLevel = 'normal' | 'low' | 'critical' | 'unlimited';

export function useChatTimer({
  userUid,
  userEmail,
  isActive,
  onTimeExpired,
}: UseChatTimerOptions) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const secondsRef = useRef<number>(300);
  const lastSavedSecondsRef = useRef<number>(300);
  const expiredTriggeredRef = useRef<boolean>(false);

  // Load initial subscription
  const refreshSubscription = useCallback(async () => {
    if (!userUid) return;
    try {
      const sub = await getUserSubscription(userUid, userEmail);
      setSubscription(sub);
      setRemainingSeconds(sub.remainingSeconds);
      secondsRef.current = sub.remainingSeconds;
      lastSavedSecondsRef.current = sub.remainingSeconds;

      if (sub.remainingSeconds === 0 && sub.planTier !== 'unlimited') {
        setIsExpired(true);
        if (!expiredTriggeredRef.current) {
          expiredTriggeredRef.current = true;
          onTimeExpired?.();
        }
      } else {
        setIsExpired(false);
        expiredTriggeredRef.current = false;
      }
    } catch (e) {
      console.warn('Timer subscription load error:', e);
    }
  }, [userUid, userEmail, onTimeExpired]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Active chat second-by-second countdown
  useEffect(() => {
    if (!isActive || isExpired) return;

    // Unlimited plan never counts down
    if (subscription?.planTier === 'unlimited' || remainingSeconds === -1) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          secondsRef.current = 0;
          setIsExpired(true);
          if (!expiredTriggeredRef.current) {
            expiredTriggeredRef.current = true;
            onTimeExpired?.();
          }
          return 0;
        }

        const next = prev - 1;
        secondsRef.current = next;

        // Periodic sync to Firestore every 10 seconds
        if (Math.abs(lastSavedSecondsRef.current - next) >= 10) {
          lastSavedSecondsRef.current = next;
          saveUserRemainingSeconds(userUid, next);
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      // Save remaining time when pausing or unmounting
      if (userUid && secondsRef.current !== -1) {
        saveUserRemainingSeconds(userUid, secondsRef.current);
      }
    };
  }, [isActive, isExpired, subscription?.planTier, userUid, onTimeExpired, remainingSeconds]);

  // Compute urgency level for UI styling
  const planTier: PlanTier = subscription?.planTier || 'free';
  const isUnlimited = planTier === 'unlimited' || remainingSeconds === -1;

  let urgencyLevel: UrgencyLevel = 'normal';
  if (isUnlimited) {
    urgencyLevel = 'unlimited';
  } else if (remainingSeconds <= 20) {
    urgencyLevel = 'critical';
  } else if (remainingSeconds <= 60) {
    urgencyLevel = 'low';
  }

  // Format seconds into MM:SS or HH:MM:SS or ∞
  const formattedTime = formatTimeRemaining(remainingSeconds, isUnlimited);

  return {
    remainingSeconds,
    formattedTime,
    planTier,
    urgencyLevel,
    isExpired,
    isUnlimited,
    subscription,
    refreshSubscription,
  };
}

function formatTimeRemaining(seconds: number, isUnlimited: boolean): string {
  if (isUnlimited || seconds === -1) return '∞';
  if (seconds <= 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

