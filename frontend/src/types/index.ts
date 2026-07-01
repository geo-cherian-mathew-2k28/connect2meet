// ─── Core Types ──────────────────────────────────────────────────────────────

export interface Participant {
  userId: string;
  displayName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  joinedAt: number;
  stream?: MediaStream;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  isSpeaking?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: number;
  isOwn?: boolean;
}

export interface Reaction {
  userId: string;
  reaction: string;
  id: string;
}

// ─── WebRTC Stats ─────────────────────────────────────────────────────────────

export interface RTCStatsSnapshot {
  // Connection
  iceConnectionState: RTCIceConnectionState;
  connectionState: RTCPeerConnectionState;
  signalingState: RTCSignalingState;
  iceGatheringState: RTCIceGatheringState;

  // Candidates
  localCandidateType: 'host' | 'srflx' | 'relay' | 'unknown';
  remoteCandidateType: 'host' | 'srflx' | 'relay' | 'unknown';
  localCandidateAddress: string;
  remoteCandidateAddress: string;
  localCandidateProtocol: 'udp' | 'tcp' | 'unknown';

  // Transport
  dtlsState: string;
  currentRoundTripTime: number; // ms

  // Bitrate
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  availableOutgoingBitrateKbps: number;

  // Quality
  packetsLost: number;
  packetsLostPercent: number;
  jitterMs: number;

  // Video
  frameWidth: number;
  frameHeight: number;
  framesPerSecond: number;
  codec: string;

  // Timestamps
  timestamp: number;
}

export interface StatsHistory {
  timestamps: number[];
  videoBitrate: number[];
  audioBitrate: number[];
  rtt: number[];
  packetsLostPercent: number[];
  fps: number[];
  jitter: number[];
}

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'connecting';

// ─── Socket Payloads ──────────────────────────────────────────────────────────

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

export interface PeerStatePayload {
  userId: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
  reaction?: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  participants: Participant[];
  isHost: boolean;
  hostId: string;
}

export interface UserJoinedPayload {
  userId: string;
  displayName: string;
  isHost: boolean;
}

export interface UserDisconnectedPayload {
  userId: string;
  hostId?: string;
}

// ─── Education ────────────────────────────────────────────────────────────────

export type NetworkFlowStage =
  | 'idle'
  | 'signaling'
  | 'ice-gathering'
  | 'stun'
  | 'turn'
  | 'connecting'
  | 'connected';

export interface PacketJourneyStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  selectedCamera: string;
  selectedMicrophone: string;
  selectedSpeaker: string;
  videoQuality: 'low' | 'medium' | 'high';
  isDarkMode: boolean;
  isLearningMode: boolean;
  noiseSuppressionEnabled: boolean;
  backgroundBlurEnabled: boolean;
  displayName: string;
}

export interface MediaConstraints {
  width: number;
  height: number;
  frameRate: number;
}
