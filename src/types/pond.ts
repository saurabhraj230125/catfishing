export type SecretIdentity = 'normal' | 'catfisher';
export type PresentedGender = 'boy' | 'girl';
export type PondState = 'idle' | 'casting' | 'bite' | 'chatting';

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string; // e.g. @kyra_singh
  email?: string;
  avatar: string;
  bio: string;
  vibes: string[]; // preset pills: 💸 Fake Rich Vibes, etc.
  secretIdentity: SecretIdentity;
  presentedGender: PresentedGender;
  xp: number;
  streak: number;
  fishCaught: number;
}

export interface PublicPondProfile {
  uid: string;
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  vibes: string[];
  presentedGender: PresentedGender;
  secretIdentity: SecretIdentity;
}

export interface QueueEntry {
  uid: string;
  profile: {
    displayName: string;
    username: string;
    avatar: string;
    bio: string;
    vibes: string[];
  };
  presentedGender: PresentedGender;
  secretRole: SecretIdentity;
  status: 'waiting' | 'matched';
  roomId: string | null;
  ignoreGenderFilter?: boolean;
  createdAt: any;
}

export interface ChatRoomDoc {
  id: string;
  player1: PublicPondProfile;
  player2: PublicPondProfile;
  status: 'active' | 'ended';
  endedBy?: string;
  createdAt: any;
  typingStatus?: {
    [uid: string]: boolean;
  };
  backspaces?: {
    [uid: string]: number;
  };
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  text: string;
  hearted: boolean;
  reaction?: string; // Quick reactions: ❤️, 😂, 💀, 🔥, 🚩, 🧢, 🎣
  createdAt: any;
}

export type GameStage =
  | 'stage_1_landing'
  | 'stage_2_identity_select'
  | 'stage_3_profile_editor'
  | 'stage_4_pond_matchmaking'
  | 'stage_5_insta_chat';
