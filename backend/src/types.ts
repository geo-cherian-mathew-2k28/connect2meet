// Shared TypeScript types for Socket.IO events between frontend and backend

export interface Participant {
  userId: string;
  displayName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  participants: Map<string, Participant>;
  createdAt: number;
  hostId: string;
}

// Socket event payloads
export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  displayName: string;
}

export interface OfferPayload {
  targetUserId: string;
  callerId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  targetUserId: string;
  callerId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  targetUserId: string;
  callerId: string;
  candidate: RTCIceCandidateInit;
}

export interface ChatMessagePayload {
  roomId: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: number;
  emoji?: boolean;
}

export interface PeerStatePayload {
  userId: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
  reaction?: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  participants: Omit<Participant, never>[];
  isHost: boolean;
  hostId: string;
}
