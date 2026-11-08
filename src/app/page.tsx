'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  SecretIdentity, 
  PublicPondProfile, 
  GameStage, 
  PondState 
} from '@/types/pond';
import { startPondMatchmaking, MatchSession } from '@/lib/matchmaker';
import { signOutUser } from '@/lib/firebase';
import { PandaPondBackground } from '@/components/PandaPondBackground';
import { TopHud } from '@/components/TopHud';
import { LandingHero } from '@/components/LandingHero';
import { IdentitySelector } from '@/components/IdentitySelector';
import { ProfileEditor } from '@/components/ProfileEditor';
import { MatchmakingRadar } from '@/components/MatchmakingRadar';
import { InstaPondChat } from '@/components/InstaPondChat';

export default function PondGamePage() {
  const [mounted, setMounted] = useState(false);
  const [currentStage, setCurrentStage] = useState<GameStage>('stage_1_landing');
  const [pondState, setPondState] = useState<PondState>('idle');

  // Auth account info
  const [authAccount, setAuthAccount] = useState<{
    uid: string;
    displayName: string;
    email?: string;
    photoURL?: string;
  } | null>(null);

  // Selected secret identity (normal vs catfisher)
  const [secretIdentity, setSecretIdentity] = useState<SecretIdentity>('normal');

  // Complete user profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Matchmaking status & fallback ignore gender toggle
  const [matchStatusText, setMatchStatusText] = useState('Casting line into the pond...');
  const [isBite, setIsBite] = useState(false);
  const [ignoreGenderFilter, setIgnoreGenderFilter] = useState(false);

  // Active chat room & opponent
  const [activeRoom, setActiveRoom] = useState<{
    roomId: string;
    opponent: PublicPondProfile;
  } | null>(null);

  const matchSessionRef = useRef<MatchSession | null>(null);

  // Client hydration & saved stats restoration (isolated per browser tab)
  useEffect(() => {
    setMounted(true);
    try {
      // Prioritize sessionStorage so opening two tabs in the same browser creates two distinct players
      const tabSaved = sessionStorage.getItem('__pond_chat_tab_profile');
      if (tabSaved) {
        const parsed = JSON.parse(tabSaved) as UserProfile;
        setUserProfile(parsed);
        setSecretIdentity(parsed.secretIdentity);
        setAuthAccount({
          uid: parsed.uid,
          displayName: parsed.displayName,
          email: parsed.email,
        });
      }
    } catch {}
  }, []);

  // Sync profile to sessionStorage for tab isolation and persist score stats
  const persistUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      sessionStorage.setItem('__pond_chat_tab_profile', JSON.stringify(updated));
      localStorage.setItem('__pond_chat_stats', JSON.stringify({
        xp: updated.xp,
        streak: updated.streak,
        fishCaught: updated.fishCaught
      }));
    } catch {}
  };

  // Stage 1 -> Stage 2: Handled on Authentication
  const handleAuthenticated = (user: { uid: string; displayName: string; email?: string; photoURL?: string }) => {
    setAuthAccount(user);
    setCurrentStage('stage_2_identity_select');
    setPondState('idle');
  };

  // Stage 2 -> Stage 3: Handled on Identity Selected (Normal vs Catfisher)
  const handleIdentitySelected = (identity: SecretIdentity) => {
    setSecretIdentity(identity);
    setCurrentStage('stage_3_profile_editor');
    setPondState('idle');
  };

  // Stage 3 -> Stage 4: Profile Complete -> Launch Matchmaking
  const handleProfileComplete = (profile: UserProfile) => {
    const updated: UserProfile = {
      ...profile,
      xp: userProfile?.xp || 0,
      streak: userProfile?.streak || 0,
      fishCaught: userProfile?.fishCaught || 0,
    };
    persistUserProfile(updated);
    triggerMatchmaking(updated, ignoreGenderFilter);
  };

  // Stage 4: Trigger Pond Matchmaking
  const triggerMatchmaking = async (profile: UserProfile, bypassGender: boolean = false) => {
    setCurrentStage('stage_4_pond_matchmaking');
    setPondState('casting');
    setIsBite(false);
    setActiveRoom(null);
    setMatchStatusText(
      bypassGender
        ? 'Fishing in the pond... Searching for ANY live player...'
        : `Fishing in the pond as ${profile.presentedGender.toUpperCase()}...`
    );

    if (matchSessionRef.current) {
      await matchSessionRef.current.cancel();
      matchSessionRef.current = null;
    }

    try {
      const session = await startPondMatchmaking(
        profile,
        {
          onStatusUpdate: (text) => {
            setMatchStatusText(text);
          },
          onBite: () => {
            setIsBite(true);
            setPondState('bite');
          },
          onMatched: (roomId, opponent) => {
            setActiveRoom({ roomId, opponent });
            setPondState('chatting');
            setCurrentStage('stage_5_insta_chat');
          },
          onError: (err) => {
            console.error('Matchmaking error:', err);
          },
        },
        bypassGender
      );

      matchSessionRef.current = session;
    } catch (err) {
      console.error('Failed to start pond matchmaking:', err);
      setCurrentStage('stage_3_profile_editor');
      setPondState('idle');
    }
  };

  // Toggle Ignore Gender Filter in Waiting Screen
  const handleToggleIgnoreGender = () => {
    const nextVal = !ignoreGenderFilter;
    setIgnoreGenderFilter(nextVal);
    if (userProfile) {
      triggerMatchmaking(userProfile, nextVal);
    }
  };

  // Cancel Matchmaking
  const handleCancelMatchmaking = async () => {
    if (matchSessionRef.current) {
      await matchSessionRef.current.cancel();
      matchSessionRef.current = null;
    }
    setPondState('idle');
    setCurrentStage('stage_3_profile_editor');
  };

  // Next / Skip Handler with XP & streak scoring
  const handleNextMatch = ({ xpGained, isCorrect }: { xpGained: number; isCorrect: boolean }) => {
    if (!userProfile) return;

    const newStreak = isCorrect ? (userProfile.streak || 0) + 1 : 0;
    const newFishCaught = (userProfile.fishCaught || 0) + 1;
    const newXp = (userProfile.xp || 0) + xpGained;

    const updatedProfile: UserProfile = {
      ...userProfile,
      xp: newXp,
      streak: newStreak,
      fishCaught: newFishCaught,
    };

    persistUserProfile(updatedProfile);
    setActiveRoom(null);
    triggerMatchmaking(updatedProfile, ignoreGenderFilter);
  };

  // Exit Arena / Sign Out
  const handleSignOut = async () => {
    await signOutUser().catch(() => {});
    setAuthAccount(null);
    setUserProfile(null);
    try {
      sessionStorage.removeItem('__pond_chat_tab_profile');
    } catch {}
    setPondState('idle');
    setCurrentStage('stage_1_landing');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#E0F7FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-teal-300 selection:text-slate-900 overflow-x-hidden">
      {/* Interactive Daylight Pond Background with Animated SVG Panda */}
      <PandaPondBackground pondState={pondState} />

      {/* Persistent Top HUD (Brand Logo, Stats & Online Badge) */}
      <TopHud
        userProfile={userProfile}
        onSignOut={userProfile ? handleSignOut : undefined}
      />

      {/* Main Game Stage Flow */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 sm:py-6">
        {currentStage === 'stage_1_landing' && (
          <LandingHero onAuthenticated={handleAuthenticated} />
        )}

        {currentStage === 'stage_2_identity_select' && (
          <IdentitySelector
            onIdentitySelected={handleIdentitySelected}
            onBack={() => {
              setPondState('idle');
              setCurrentStage('stage_1_landing');
            }}
          />
        )}

        {currentStage === 'stage_3_profile_editor' && authAccount && (
          <ProfileEditor
            initialUid={authAccount.uid}
            initialDisplayName={authAccount.displayName}
            secretIdentity={secretIdentity}
            onProfileComplete={handleProfileComplete}
            onBack={() => {
              setPondState('idle');
              setCurrentStage('stage_2_identity_select');
            }}
          />
        )}

        {currentStage === 'stage_4_pond_matchmaking' && userProfile && (
          <MatchmakingRadar
            currentUser={userProfile}
            statusText={matchStatusText}
            isBite={isBite}
            ignoreGenderFilter={ignoreGenderFilter}
            onToggleIgnoreGender={handleToggleIgnoreGender}
            onCancel={handleCancelMatchmaking}
          />
        )}

        {currentStage === 'stage_5_insta_chat' && userProfile && activeRoom && (
          <InstaPondChat
            roomId={activeRoom.roomId}
            currentUser={userProfile}
            opponent={activeRoom.opponent}
            onNextMatch={handleNextMatch}
            onExit={() => {
              setPondState('idle');
              setCurrentStage('stage_2_identity_select');
            }}
          />
        )}
      </main>
    </div>
  );
}
