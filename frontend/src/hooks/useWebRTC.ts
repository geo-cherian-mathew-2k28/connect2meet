import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket, connectSocket } from '@/socket';
import { useMeetingStore } from '@/store/meetingStore';
import { VIDEO_QUALITY_CONSTRAINTS } from '@/network/iceHelpers';
import type {
  RoomJoinedPayload,
  UserJoinedPayload,
  UserDisconnectedPayload,
  PeerStatePayload,
} from '@/types';

// ICE servers — Google STUN + Metered TURN fallback (env-configurable)
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TURN server can be configured via env vars for cross-network support
  ...(import.meta.env.VITE_TURN_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME || '',
          credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
        } as RTCIceServer,
      ]
    : []),
];

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerConnections: Map<string, RTCPeerConnection>;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  connectionState: RTCPeerConnectionState | null;
  iceState: RTCIceConnectionState | null;
  toggleMute: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  toggleHand: () => void;
  sendReaction: (emoji: string) => void;
  leaveRoom: () => void;
  getActivePeerConnection: () => RTCPeerConnection | null;
  admissionStatus: 'idle' | 'waiting' | 'approved' | 'denied';
  pendingAdmissions: { userId: string; displayName: string; socketId: string }[];
  respondToAdmission: (pendingSocketId: string, allowed: boolean) => void;
  isCaptionsEnabled: boolean;
  captions: { userId: string; displayName: string; text: string; id: string }[];
  toggleCaptions: () => void;
}

export function useWebRTC(roomId: string | null, userId: string, displayName: string): UseWebRTCReturn {
  const socket = getSocket();
  const store = useMeetingStore();
  const { settings } = store;

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]);

  // Fetch TURN credentials from Metered REST API on mount
  useEffect(() => {
    let active = true;
    const fetchTurnCredentials = async () => {
      const apiKey = import.meta.env.VITE_METERED_API_KEY;
      if (!apiKey) {
        console.warn('[WebRTC] VITE_METERED_API_KEY is not defined in environment variables. Falling back to local configuration.');
        // Fallback to static TURN config if present
        if (import.meta.env.VITE_TURN_URL) {
          setIceServers([
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: import.meta.env.VITE_TURN_URL,
              username: import.meta.env.VITE_TURN_USERNAME || '',
              credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
            } as RTCIceServer
          ]);
        }
        return;
      }

      try {
        const response = await fetch(`https://gcm.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
        if (!response.ok) throw new Error('Failed to fetch TURN credentials');
        const fetchedServers = await response.json();
        if (active && Array.isArray(fetchedServers) && fetchedServers.length > 0) {
          console.log('[WebRTC] Dynamically loaded Metered TURN servers:', fetchedServers.length);
          setIceServers([
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            ...fetchedServers
          ]);
        }
      } catch (err) {
        console.warn('[WebRTC] Failed to fetch TURN credentials from API, falling back to static config:', err);
        if (import.meta.env.VITE_TURN_URL) {
          setIceServers([
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: import.meta.env.VITE_TURN_URL,
              username: import.meta.env.VITE_TURN_USERNAME || '',
              credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
            } as RTCIceServer
          ]);
        }
      }
    };

    fetchTurnCredentials();
    return () => {
      active = false;
    };
  }, []);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [iceState, setIceState] = useState<RTCIceConnectionState | null>(null);

  const [admissionStatus, setAdmissionStatus] = useState<'idle' | 'waiting' | 'approved' | 'denied'>('idle');
  const [pendingAdmissions, setPendingAdmissions] = useState<{ userId: string; displayName: string; socketId: string }[]>([]);

  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [captions, setCaptions] = useState<{ userId: string; displayName: string; text: string; id: string }[]>([]);
  const recognitionRef = useRef<any>(null);

  // Helper to sync ref + state for remoteStreams
  const updateRemoteStreams = useCallback(() => {
    setRemoteStreams(new Map(remoteStreamsRef.current));
  }, []);

  const updatePeerConnections = useCallback(() => {
    setPeerConnections(new Map(peerConnectionsRef.current));
  }, []);

  // ─── Connection Recovery (ICE Restart) ────────────────────────────────────
  const restartConnection = useCallback(async (remoteUserId: string) => {
    const pc = peerConnectionsRef.current.get(remoteUserId);
    if (!pc) return;
    try {
      console.log(`[WebRTC] Initiating ICE Restart for peer: ${remoteUserId}`);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit('offer', {
        targetUserId: remoteUserId,
        callerId: userId,
        sdp: offer,
      });
    } catch (e) {
      console.error('[WebRTC] Failed to perform ICE Restart for peer:', remoteUserId, e);
    }
  }, [socket, userId]);

  // ─── Create or get peer connection ────────────────────────────────────────
  const createPeerConnection = useCallback(
    (remoteUserId: string): RTCPeerConnection => {
      if (peerConnectionsRef.current.has(remoteUserId)) {
        return peerConnectionsRef.current.get(remoteUserId)!;
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming tracks
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          remoteStreamsRef.current.set(remoteUserId, stream);
          updateRemoteStreams();
          store.updateParticipant(remoteUserId, { stream });
        }
      };

      // Trickle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetUserId: remoteUserId,
            callerId: userId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // State change tracking
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        store.updateParticipant(remoteUserId, {
          connectionQuality:
            pc.connectionState === 'connected' ? 'good' : undefined,
        });
      };

      pc.oniceconnectionstatechange = () => {
        setIceState(pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          restartConnection(remoteUserId);
        }
      };

      peerConnectionsRef.current.set(remoteUserId, pc);
      updatePeerConnections();
      return pc;
    },
    [socket, userId, store, updateRemoteStreams, updatePeerConnections, restartConnection]
  );

  // ─── Acquire local media ───────────────────────────────────────────────────
  const startLocalMedia = useCallback(async () => {
    const quality = VIDEO_QUALITY_CONSTRAINTS[settings.videoQuality] || VIDEO_QUALITY_CONSTRAINTS.medium;

    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: settings.noiseSuppressionEnabled,
        autoGainControl: true,
        ...(settings.selectedMicrophone ? { deviceId: { exact: settings.selectedMicrophone } } : {}),
      },
      video: {
        width: { ideal: quality.width },
        height: { ideal: quality.height },
        frameRate: { ideal: quality.frameRate },
        ...(settings.selectedCamera ? { deviceId: { exact: settings.selectedCamera } } : {}),
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Could not get media, using audio-only:', err);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        return audioStream;
      } catch {
        console.error('[WebRTC] No media access at all');
        return null;
      }
    }
  }, [settings]);

  // ─── Join room flow ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    connectSocket();

    // Handler: wait in lobby
    socket.on('join-waiting', () => {
      setAdmissionStatus('waiting');
    });

    // Handler: denied entry by host
    socket.on('join-denied', () => {
      setAdmissionStatus('denied');
    });

    // Handler: room-joined tells us who's already there (approved entry)
    socket.on('room-joined', async ({ participants, isHost, hostId }: RoomJoinedPayload) => {
      setAdmissionStatus('approved');
      store.setRoom(roomId, userId, isHost, hostId);
      store.setParticipants(participants);

      // Initiate offer to each existing participant
      for (const participant of participants) {
        const pc = createPeerConnection(participant.userId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            targetUserId: participant.userId,
            callerId: userId,
            sdp: offer,
          });
        } catch (e) {
          console.error('[WebRTC] Failed to create offer for', participant.userId, e);
        }
      }
    });

    // Handler: for host, receive other users requests to join
    socket.on('admission-request', (req: { userId: string; displayName: string; socketId: string }) => {
      setPendingAdmissions((prev) => [...prev.filter((r) => r.userId !== req.userId), req]);
    });

    // Handler: new user joined — they will send us an offer
    socket.on('user-joined', ({ userId: remoteId, displayName: remoteName, isHost }: UserJoinedPayload) => {
      store.addParticipant({
        userId: remoteId,
        displayName: remoteName,
        isHost,
        isMuted: false,
        isVideoOff: false,
        isHandRaised: false,
        joinedAt: Date.now(),
      });
      // Pre-create PC so it's ready to receive offer
      createPeerConnection(remoteId);
    });

    // Handler: receive offer — set remote desc + send answer
    socket.on('offer', async ({ callerId, sdp }: { callerId: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = createPeerConnection(callerId);
      try {
        const offerCollision = pc.signalingState === 'have-local-offer';
        if (offerCollision) {
          // Compare IDs to decide who wins. Smaller string ID is polite.
          if (userId < callerId) {
            console.log(`[WebRTC] Collision: rolling back local offer for peer ${callerId}`);
            await pc.setLocalDescription({ type: 'rollback' });
          } else {
            console.log(`[WebRTC] Collision: impolite peer ignoring offer from ${callerId}`);
            return;
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
          targetUserId: callerId,
          callerId: userId,
          sdp: answer,
        });
      } catch (e) {
        console.error('[WebRTC] Failed to answer offer from', callerId, e);
      }
    });

    // Handler: receive answer
    socket.on('answer', async ({ callerId, sdp }: { callerId: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionsRef.current.get(callerId);
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (e) {
          console.error('[WebRTC] Failed to set remote answer from', callerId, e);
        }
      }
    });

    // Handler: receive ICE candidate
    socket.on('ice-candidate', async ({ callerId, candidate }: { callerId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionsRef.current.get(callerId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[WebRTC] Failed to add ICE candidate from', callerId, e);
        }
      }
    });

    // Handler: user disconnected
    socket.on('user-disconnected', ({ userId: remoteId, hostId }: UserDisconnectedPayload) => {
      const pc = peerConnectionsRef.current.get(remoteId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(remoteId);
        updatePeerConnections();
      }
      remoteStreamsRef.current.delete(remoteId);
      updateRemoteStreams();
      store.removeParticipant(remoteId);
      if (hostId) {
        store.updateParticipant(hostId, { isHost: true });
      }
    });

    // Handler: peer state changes (mute/video)
    socket.on('peer-state', (payload: PeerStatePayload) => {
      store.updateParticipant(payload.userId, {
        isMuted: payload.isMuted,
        isVideoOff: payload.isVideoOff,
        isHandRaised: payload.isHandRaised,
      });
    });

    // Handler: reactions
    socket.on('reaction', ({ userId: fromId, reaction }: { userId: string; reaction: string }) => {
      const id = `${fromId}-${Date.now()}`;
      store.addReaction({ userId: fromId, reaction, id });
      setTimeout(() => store.removeReaction(id), 4000);
    });

    // Handler: captions
    socket.on('caption', (payload: { userId: string; displayName: string; text: string }) => {
      const captionId = Math.random().toString(36).substr(2, 9);
      setCaptions((prev) => {
        const filtered = prev.filter((c) => c.userId !== payload.userId);
        return [...filtered, { ...payload, id: captionId }];
      });

      // Auto remove remote caption after 4 seconds
      setTimeout(() => {
        setCaptions((prev) => prev.filter((c) => c.id !== captionId));
      }, 4000);
    });

    // Start media then request join
    startLocalMedia().then(() => {
      socket.emit('request-join', { roomId, userId, displayName });
    });

    return () => {
      // Cleanup on unmount
      socket.off('join-waiting');
      socket.off('join-denied');
      socket.off('room-joined');
      socket.off('admission-request');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
      socket.off('peer-state');
      socket.off('reaction');
      socket.off('caption');
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Controls ──────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
    socket.emit('peer-state', { userId, isMuted: nextMuted });
  }, [isMuted, socket, userId]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextVideoOff = !isVideoOff;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !nextVideoOff;
    });
    setIsVideoOff(nextVideoOff);
    socket.emit('peer-state', { userId, isVideoOff: nextVideoOff });
  }, [isVideoOff, socket, userId]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      const videoTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });

      // Update local stream display
      if (localStreamRef.current) {
        const localVideo = localStreamRef.current.getVideoTracks()[0];
        if (localVideo) localStreamRef.current.removeTrack(localVideo);
        localStreamRef.current.addTrack(videoTrack);
      }

      setIsScreenSharing(true);
      videoTrack.onended = () => stopScreenShare();
    } catch (e) {
      console.error('[WebRTC] Screen share failed:', e);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    const screenStream = screenStreamRef.current;
    if (!screenStream) return;

    screenStream.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    // Restore camera
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((camStream) => {
        const videoTrack = camStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });
        if (localStreamRef.current) {
          const oldVideo = localStreamRef.current.getVideoTracks()[0];
          if (oldVideo) localStreamRef.current.removeTrack(oldVideo);
          localStreamRef.current.addTrack(videoTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }
      })
      .catch(console.error);

    setIsScreenSharing(false);
  }, []);

  const toggleHand = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    socket.emit('peer-state', { userId, isHandRaised: next });
  }, [isHandRaised, socket, userId]);

  const sendReaction = useCallback(
    (reaction: string) => {
      socket.emit('reaction', { userId, reaction });
      const id = `${userId}-${Date.now()}`;
      store.addReaction({ userId, reaction, id });
      setTimeout(() => store.removeReaction(id), 4000);
    },
    [socket, userId, store]
  );

  const leaveRoom = useCallback(() => {
    socket.emit('leave-room');
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    store.clearRoom();
  }, [socket, store]);

  // Dynamic device track replacement
  useEffect(() => {
    const currentStream = localStreamRef.current;
    if (!currentStream) return;
    let active = true;

    const updateMediaDevices = async () => {
      const quality = VIDEO_QUALITY_CONSTRAINTS[settings.videoQuality] || VIDEO_QUALITY_CONSTRAINTS.medium;
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: settings.noiseSuppressionEnabled,
          autoGainControl: true,
          ...(settings.selectedMicrophone ? { deviceId: { exact: settings.selectedMicrophone } } : {}),
        },
        ...(!isScreenSharing ? {
          video: {
            width: { ideal: quality.width },
            height: { ideal: quality.height },
            frameRate: { ideal: quality.frameRate },
            ...(settings.selectedCamera ? { deviceId: { exact: settings.selectedCamera } } : {}),
          }
        } : {})
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Apply current mute/video state
        newStream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
        if (!isScreenSharing) {
          newStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
        }

        const newAudioTrack = newStream.getAudioTracks()[0];
        const newVideoTrack = !isScreenSharing ? newStream.getVideoTracks()[0] : null;

        // Stop old tracks
        currentStream.getAudioTracks().forEach((t) => t.stop());
        if (!isScreenSharing) {
          currentStream.getVideoTracks().forEach((t) => t.stop());
        }

        // Replace on all PCs
        peerConnectionsRef.current.forEach((pc) => {
          pc.getSenders().forEach((sender) => {
            if (sender.track?.kind === 'video' && newVideoTrack) {
              sender.replaceTrack(newVideoTrack).catch(console.error);
            } else if (sender.track?.kind === 'audio' && newAudioTrack) {
              sender.replaceTrack(newAudioTrack).catch(console.error);
            }
          });
        });

        // Assemble combined local stream ref
        const tracksToKeep = [
          newAudioTrack,
          ...(isScreenSharing ? currentStream.getVideoTracks() : (newVideoTrack ? [newVideoTrack] : []))
        ].filter(Boolean) as MediaStreamTrack[];

        const combinedStream = new MediaStream(tracksToKeep);
        localStreamRef.current = combinedStream;
        setLocalStream(combinedStream);
      } catch (err) {
        console.error('[WebRTC] Failed to dynamically swap media tracks:', err);
      }
    };

    updateMediaDevices();

    return () => {
      active = false;
    };
  }, [
    settings.selectedCamera,
    settings.selectedMicrophone,
    settings.videoQuality,
    settings.noiseSuppressionEnabled,
    isScreenSharing
  ]);

  const getActivePeerConnection = useCallback((): RTCPeerConnection | null => {
    const pcs = peerConnectionsRef.current;
    if (pcs.size === 0) return null;
    return pcs.values().next().value || null;
  }, []);

  const respondToAdmission = useCallback((pendingSocketId: string, allowed: boolean) => {
    const request = pendingAdmissions.find((r) => r.socketId === pendingSocketId);
    if (!request) return;

    socket.emit('admission-response', {
      roomId,
      userId: request.userId,
      allowed,
      pendingSocketId,
      displayName: request.displayName,
    });

    setPendingAdmissions((prev) => prev.filter((r) => r.socketId !== pendingSocketId));
  }, [roomId, pendingAdmissions, socket]);

  // Speech Recognition hook logic
  useEffect(() => {
    if (!isCaptionsEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      setIsCaptionsEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentTranscript += event.results[i][0].transcript;
        }
      }

      const text = currentTranscript.trim();
      if (text) {
        socket.emit('caption', {
          userId,
          displayName,
          text,
        });

        const captionId = Math.random().toString(36).substr(2, 9);
        setCaptions((prev) => {
          const filtered = prev.filter((c) => c.userId !== userId);
          return [...filtered, { userId, displayName: 'You', text, id: captionId }];
        });

        setTimeout(() => {
          setCaptions((prev) => prev.filter((c) => c.id !== captionId));
        }, 4000);
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
    };

    recognition.onend = () => {
      if (isCaptionsEnabled) {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Failed to restart speech recognition:", err);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isCaptionsEnabled, userId, displayName]);

  const toggleCaptions = useCallback(() => {
    setIsCaptionsEnabled((prev) => !prev);
  }, []);

  return {
    localStream,
    remoteStreams,
    peerConnections,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    connectionState,
    iceState,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    toggleHand,
    sendReaction,
    leaveRoom,
    getActivePeerConnection,
    admissionStatus,
    pendingAdmissions,
    respondToAdmission,
    isCaptionsEnabled,
    captions,
    toggleCaptions,
  };
}
