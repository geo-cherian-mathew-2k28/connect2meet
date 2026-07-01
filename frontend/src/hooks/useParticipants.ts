import { useEffect, useRef, useCallback } from 'react';
import { useMeetingStore } from '@/store/meetingStore';

/**
 * Detects speaking via AudioContext AnalyserNode.
 * Polls every 100ms, updates participant isSpeaking in store.
 */
export function useParticipants(localStream: MediaStream | null, userId: string) {
  const store = useMeetingStore();
  const { participants, localUserId, isHost, hostId } = store;
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up local speaking detection
  useEffect(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(localStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const buf = new Uint8Array(analyser.frequencyBinCount);
      pollRef.current = setInterval(() => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        const speaking = avg > 20;
        store.updateParticipant(userId, { isSpeaking: speaking });
      }, 100);
    } catch (e) {
      console.warn('[Participants] AudioContext failed:', e);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      audioCtxRef.current?.close();
    };
  }, [localStream, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const participantList = Object.values(participants);

  const muteAll = useCallback(() => {
    if (!isHost) return;
    // Signal all to mute (host-only feature)
    participantList.forEach((p) => {
      if (p.userId !== localUserId) {
        store.updateParticipant(p.userId, { isMuted: true });
      }
    });
  }, [isHost, participantList, localUserId, store]);

  return {
    participants: participantList,
    isHost,
    hostId,
    muteAll,
  };
}
