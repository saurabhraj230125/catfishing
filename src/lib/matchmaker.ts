import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  onSnapshot,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from './firebase';
import { 
  UserProfile, 
  QueueEntry, 
  ChatRoomDoc, 
  ChatMessage, 
  PresentedGender,
  PublicPondProfile
} from '@/types/pond';

export interface MatchmakingCallbacks {
  onStatusUpdate: (status: string) => void;
  onBite: () => void;
  onMatched: (roomId: string, opponentProfile: PublicPondProfile) => void;
  onError: (err: Error) => void;
}

export interface MatchSession {
  cancel: () => Promise<void>;
}

// Local bus fallback for multi-tab testing if live Firebase not reachable
const LOCAL_BUS_NAME = 'real_two_player_pond_mesh';
let localBus: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBus = new BroadcastChannel(LOCAL_BUS_NAME);
  } catch (e) {
    console.warn('BroadcastChannel unavailable', e);
  }
}

/**
 * Real Two-Player Matchmaking Engine (Boy ↔ Girl, or Anyone if ignoreGenderFilter=true)
 * Firestore Transaction on `pond_queue` & `chat_rooms`
 */
export async function startPondMatchmaking(
  user: UserProfile,
  callbacks: MatchmakingCallbacks,
  ignoreGenderFilter: boolean = false
): Promise<MatchSession> {
  let isCancelled = false;
  const oppositeGender: PresentedGender = user.presentedGender === 'boy' ? 'girl' : 'boy';

  callbacks.onStatusUpdate(
    ignoreGenderFilter
      ? 'Casting line... Searching for ANY live player in the pond...'
      : `Casting line... Searching for a ${oppositeGender.toUpperCase()}...`
  );

  // If live Firebase is not configured, route through real local multi-tab mesh
  if (!isLiveFirebaseConfigured) {
    return runLocalMultiTabMatchmaking(user, oppositeGender, ignoreGenderFilter, callbacks);
  }

  const userQueueDocRef = doc(db, 'pond_queue', user.uid);

  try {
    // Query waiting queue candidates
    const queueCollection = collection(db, 'pond_queue');
    const q = query(
      queueCollection,
      where('status', '==', 'waiting'),
      limit(15)
    );

    const snapshot = await getDocs(q);
    let matchedPartnerData: QueueEntry | null = null;
    let createdRoomId = '';

    if (!snapshot.empty) {
      // Find candidate in memory to avoid requiring composite indexes
      const candidateDocs = snapshot.docs.filter((d) => {
        if (d.id === user.uid) return false;
        const data = d.data() as QueueEntry;
        if (data.uid === user.uid) return false;
        if (data.status !== 'waiting' || data.roomId) return false;
        if (ignoreGenderFilter) return true;
        return data.presentedGender === oppositeGender;
      });

      for (const candidateDoc of candidateDocs) {
        if (isCancelled) break;
        const candidateRef = doc(db, 'pond_queue', candidateDoc.id);
        const candidateData = candidateDoc.data() as QueueEntry;
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        try {
          await runTransaction(db, async (transaction) => {
            const freshCandidate = await transaction.get(candidateRef);
            if (!freshCandidate.exists()) throw new Error('Partner left queue');
            const data = freshCandidate.data() as QueueEntry;
            if (data.status !== 'waiting' || data.roomId) throw new Error('Partner already claimed');

            const roomRef = doc(db, 'chat_rooms', roomId);
            const myPublicProfile: PublicPondProfile = {
              uid: user.uid,
              displayName: user.displayName,
              username: user.username,
              avatar: user.avatar,
              bio: user.bio,
              vibes: user.vibes,
              presentedGender: user.presentedGender,
              secretIdentity: user.secretIdentity,
            };

            const partnerPublicProfile: PublicPondProfile = {
              uid: candidateData.uid,
              displayName: candidateData.profile.displayName,
              username: candidateData.profile.username,
              avatar: candidateData.profile.avatar,
              bio: candidateData.profile.bio,
              vibes: candidateData.profile.vibes,
              presentedGender: candidateData.presentedGender,
              secretIdentity: candidateData.secretRole,
            };

            const newRoom: ChatRoomDoc = {
              id: roomId,
              player1: myPublicProfile,
              player2: partnerPublicProfile,
              status: 'active',
              createdAt: serverTimestamp(),
              typingStatus: {
                [user.uid]: false,
                [candidateData.uid]: false,
              },
              backspaces: {
                [user.uid]: 0,
                [candidateData.uid]: 0,
              },
            };

            // 1. Create active room
            transaction.set(roomRef, newRoom);

            // 2. Update matched partner's queue entry so their onSnapshot triggers
            transaction.update(candidateRef, {
              status: 'matched',
              roomId: roomId,
            });

            // 3. Remove/update current user
            transaction.set(userQueueDocRef, {
              uid: user.uid,
              status: 'matched',
              roomId: roomId,
              updatedAt: serverTimestamp(),
            });
          });

          matchedPartnerData = candidateData;
          createdRoomId = roomId;
          break;
        } catch {
          // Transaction race collision, attempt next partner
        }
      }
    }

    // If we paired with someone immediately
    if (matchedPartnerData && createdRoomId) {
      callbacks.onBite();
      callbacks.onStatusUpdate(`Machhli fas gayi! Connected with @${matchedPartnerData.profile.username}...`);

      const opponent: PublicPondProfile = {
        uid: matchedPartnerData.uid,
        displayName: matchedPartnerData.profile.displayName,
        username: matchedPartnerData.profile.username,
        avatar: matchedPartnerData.profile.avatar,
        bio: matchedPartnerData.profile.bio,
        vibes: matchedPartnerData.profile.vibes,
        presentedGender: matchedPartnerData.presentedGender,
        secretIdentity: matchedPartnerData.secretRole,
      };

      setTimeout(() => {
        callbacks.onMatched(createdRoomId, opponent);
      }, 1200);

      return {
        cancel: async () => {
          isCancelled = true;
          await deleteDoc(userQueueDocRef).catch(() => {});
        },
      };
    }

    // Step 2: Queue empty -> write self to pond_queue and attach onSnapshot
    callbacks.onStatusUpdate(
      ignoreGenderFilter
        ? 'Bobber in water... Waiting for anyone to take the bait...'
        : `Bobber in water... Waiting for a ${oppositeGender.toUpperCase()} to bite...`
    );

    const myQueueEntry: QueueEntry = {
      uid: user.uid,
      profile: {
        displayName: user.displayName,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        vibes: user.vibes,
      },
      presentedGender: user.presentedGender,
      secretRole: user.secretIdentity,
      status: 'waiting',
      roomId: null,
      createdAt: serverTimestamp(),
    };

    await setDoc(userQueueDocRef, myQueueEntry);

    const unsubscribe = onSnapshot(userQueueDocRef, async (queueSnap) => {
      if (isCancelled || !queueSnap.exists()) return;
      const data = queueSnap.data() as QueueEntry;

      if (data.status === 'matched' && data.roomId) {
        callbacks.onBite();
        callbacks.onStatusUpdate('Bite on the line! Reeling in live partner...');

        const roomRef = doc(db, 'chat_rooms', data.roomId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          const room = roomSnap.data() as ChatRoomDoc;
          const opponent = room.player1.uid === user.uid ? room.player2 : room.player1;

          unsubscribe();
          await deleteDoc(userQueueDocRef).catch(() => {});

          setTimeout(() => {
            if (opponent) {
              callbacks.onMatched(data.roomId!, opponent);
            }
          }, 1200);
        }
      }
    });

    return {
      cancel: async () => {
        isCancelled = true;
        unsubscribe();
        await deleteDoc(userQueueDocRef).catch(() => {});
      },
    };
  } catch (error: any) {
    callbacks.onError(error);
    return {
      cancel: async () => { isCancelled = true; },
    };
  }
}

// -------------------------------------------------------------------------
// REAL-TIME CHAT LISTENERS (`chat_rooms/{roomId}/messages` & parent doc)
// -------------------------------------------------------------------------

export interface RoomSubscriptionCallbacks {
  onMessage: (msg: ChatMessage) => void;
  onRoomEnded: (endedBy?: string) => void;
  onTypingTelemetry: (opponentUid: string, isTyping: boolean, backspaces: number) => void;
}

export function subscribeToChatRoom(
  roomId: string,
  currentUserId: string,
  callbacks: RoomSubscriptionCallbacks
): () => void {
  if (!isLiveFirebaseConfigured) {
    return subscribeToLocalRoom(roomId, currentUserId, callbacks);
  }

  const roomDocRef = doc(db, 'chat_rooms', roomId);
  const messagesCollectionRef = collection(db, 'chat_rooms', roomId, 'messages');
  const messagesQuery = query(messagesCollectionRef, orderBy('createdAt', 'asc'));

  // 1. Listen for room lifecycle & typing telemetry
  const unsubRoom = onSnapshot(roomDocRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data() as ChatRoomDoc;

    if (room.status === 'ended') {
      callbacks.onRoomEnded(room.endedBy);
    }

    if (room.typingStatus && room.backspaces) {
      const opponentUid = Object.keys(room.typingStatus).find((uid) => uid !== currentUserId);
      if (opponentUid) {
        callbacks.onTypingTelemetry(
          opponentUid,
          Boolean(room.typingStatus[opponentUid]),
          room.backspaces[opponentUid] || 0
        );
      }
    }
  });

  // 2. Listen for messages
  const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      callbacks.onMessage({
        id: change.doc.id,
        senderUid: data.senderUid,
        text: data.text,
        hearted: Boolean(data.hearted),
        createdAt: data.createdAt,
      });
    });
  });

  return () => {
    unsubRoom();
    unsubMessages();
  };
}

export async function sendChatMessage(
  roomId: string,
  senderUid: string,
  text: string
): Promise<void> {
  const clean = text.trim();
  if (!clean) return;

  if (!isLiveFirebaseConfigured) {
    sendLocalChatMessage(roomId, senderUid, clean);
    return;
  }

  const messagesRef = collection(db, 'chat_rooms', roomId, 'messages');
  await addDoc(messagesRef, {
    senderUid,
    text: clean,
    hearted: false,
    createdAt: serverTimestamp(),
  });

  // Reset typing state on send
  const roomRef = doc(db, 'chat_rooms', roomId);
  await updateDoc(roomRef, {
    [`typingStatus.${senderUid}`]: false,
    [`backspaces.${senderUid}`]: 0,
  }).catch(() => {});
}

export async function toggleMessageHeart(
  roomId: string,
  messageId: string,
  currentHearted: boolean
): Promise<void> {
  if (!isLiveFirebaseConfigured) {
    toggleLocalMessageHeart(roomId, messageId, !currentHearted);
    return;
  }

  const msgRef = doc(db, 'chat_rooms', roomId, 'messages', messageId);
  await updateDoc(msgRef, {
    hearted: !currentHearted,
  }).catch(() => {});
}

export async function updateTypingTelemetry(
  roomId: string,
  userId: string,
  isTyping: boolean,
  backspaces: number
): Promise<void> {
  if (!isLiveFirebaseConfigured) {
    sendLocalTelemetry(roomId, userId, isTyping, backspaces);
    return;
  }

  const roomRef = doc(db, 'chat_rooms', roomId);
  await updateDoc(roomRef, {
    [`typingStatus.${userId}`]: isTyping,
    [`backspaces.${userId}`]: backspaces,
  }).catch(() => {});
}

export async function leaveChatRoom(roomId: string, userId: string): Promise<void> {
  if (!isLiveFirebaseConfigured) {
    leaveLocalRoom(roomId, userId);
    return;
  }

  const roomRef = doc(db, 'chat_rooms', roomId);
  await updateDoc(roomRef, {
    status: 'ended',
    endedBy: userId,
  }).catch(() => {});
}

// =========================================================================
// REAL TWO-PLAYER MULTI-TAB MESH (Zero-config 2-browser testing fallback)
// =========================================================================

interface LocalQueueMessage {
  type: 'POND_JOIN' | 'POND_CLAIM' | 'POND_MSG' | 'POND_HEART' | 'POND_TELEMETRY' | 'POND_END';
  payload: any;
}

function getStoredLocalQueue(): Record<string, QueueEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('__two_player_pond_queue');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredLocalQueue(q: Record<string, QueueEntry>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('__two_player_pond_queue', JSON.stringify(q));
  } catch {}
}

function runLocalMultiTabMatchmaking(
  user: UserProfile,
  oppositeGender: PresentedGender,
  ignoreGenderFilter: boolean,
  callbacks: MatchmakingCallbacks
): MatchSession {
  let isCancelled = false;
  const currentQueue = getStoredLocalQueue();

  const candidateIds = Object.keys(currentQueue).filter((id) => {
    const entry = currentQueue[id];
    if (id === user.uid || entry.status !== 'waiting') return false;
    if (ignoreGenderFilter) return true;
    return entry.presentedGender === oppositeGender;
  });

  if (candidateIds.length > 0) {
    const peerId = candidateIds[0];
    const peer = currentQueue[peerId];
    const roomId = `room_mesh_${Date.now()}`;

    delete currentQueue[peerId];
    delete currentQueue[user.uid];
    saveStoredLocalQueue(currentQueue);

    const myPublicProfile: PublicPondProfile = {
      uid: user.uid,
      displayName: user.displayName,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      vibes: user.vibes,
      presentedGender: user.presentedGender,
      secretIdentity: user.secretIdentity,
    };

    const peerPublicProfile: PublicPondProfile = {
      uid: peer.uid,
      displayName: peer.profile.displayName,
      username: peer.profile.username,
      avatar: peer.profile.avatar,
      bio: peer.profile.bio,
      vibes: peer.profile.vibes,
      presentedGender: peer.presentedGender,
      secretIdentity: peer.secretRole,
    };

    localBus?.postMessage({
      type: 'POND_CLAIM',
      payload: {
        targetUserId: peerId,
        matchedWith: myPublicProfile,
        roomId,
      },
    });

    callbacks.onBite();
    callbacks.onStatusUpdate(`Machhli fas gayi! Connected with @${peer.profile.username}...`);

    setTimeout(() => {
      if (!isCancelled) {
        callbacks.onMatched(roomId, peerPublicProfile);
      }
    }, 1200);

    return {
      cancel: async () => { isCancelled = true; },
    };
  }

  currentQueue[user.uid] = {
    uid: user.uid,
    presentedGender: user.presentedGender,
    secretRole: user.secretIdentity,
    profile: {
      displayName: user.displayName,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      vibes: user.vibes,
    },
    status: 'waiting',
    roomId: null,
    createdAt: Date.now(),
  };
  saveStoredLocalQueue(currentQueue);

  localBus?.postMessage({
    type: 'POND_JOIN',
    payload: { user },
  });

  const handleBusMessage = (event: MessageEvent<LocalQueueMessage>) => {
    if (isCancelled) return;
    const { type, payload } = event.data;
    if (type === 'POND_CLAIM' && payload.targetUserId === user.uid) {
      callbacks.onBite();
      callbacks.onStatusUpdate('Bite on the line! Reeling in live partner...');
      setTimeout(() => {
        if (!isCancelled) {
          callbacks.onMatched(payload.roomId, payload.matchedWith);
        }
      }, 1200);
    }
  };

  localBus?.addEventListener('message', handleBusMessage);

  return {
    cancel: async () => {
      isCancelled = true;
      localBus?.removeEventListener('message', handleBusMessage);
      const q = getStoredLocalQueue();
      delete q[user.uid];
      saveStoredLocalQueue(q);
    },
  };
}

function subscribeToLocalRoom(
  roomId: string,
  currentUserId: string,
  callbacks: RoomSubscriptionCallbacks
): () => void {
  const handler = (event: MessageEvent<LocalQueueMessage>) => {
    const { type, payload } = event.data;
    if (payload?.roomId !== roomId) return;

    if (type === 'POND_MSG') {
      callbacks.onMessage(payload.message);
    } else if (type === 'POND_HEART') {
      callbacks.onMessage(payload.message);
    } else if (type === 'POND_TELEMETRY' && payload.userId !== currentUserId) {
      callbacks.onTypingTelemetry(payload.userId, payload.isTyping, payload.backspaces);
    } else if (type === 'POND_END') {
      callbacks.onRoomEnded(payload.endedBy);
    }
  };

  localBus?.addEventListener('message', handler);

  return () => {
    localBus?.removeEventListener('message', handler);
  };
}

function sendLocalChatMessage(roomId: string, senderUid: string, text: string) {
  const message: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderUid,
    text,
    hearted: false,
    createdAt: Date.now(),
  };

  localBus?.postMessage({
    type: 'POND_MSG',
    payload: { roomId, message },
  });
}

function toggleLocalMessageHeart(roomId: string, messageId: string, hearted: boolean) {
  localBus?.postMessage({
    type: 'POND_HEART',
    payload: {
      roomId,
      message: {
        id: messageId,
        senderUid: '',
        text: '',
        hearted,
        createdAt: Date.now(),
      },
    },
  });
}

function sendLocalTelemetry(roomId: string, userId: string, isTyping: boolean, backspaces: number) {
  localBus?.postMessage({
    type: 'POND_TELEMETRY',
    payload: {
      roomId,
      userId,
      isTyping,
      backspaces,
    },
  });
}

function leaveLocalRoom(roomId: string, userId: string) {
  localBus?.postMessage({
    type: 'POND_END',
    payload: { roomId, endedBy: userId },
  });
}
