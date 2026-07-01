import { useState, useEffect, useCallback, useRef } from 'react';
import { StatsPoller, appendToHistory, emptyHistory } from '@/stats/statsPoller';
import { deriveConnectionQuality } from '@/network/iceHelpers';
import type { RTCStatsSnapshot, StatsHistory, ConnectionQuality } from '@/types';

export interface UseStatsReturn {
  snapshot: RTCStatsSnapshot | null;
  history: StatsHistory;
  quality: ConnectionQuality;
  isPolling: boolean;
}

export function useStats(getPeerConnection: () => RTCPeerConnection | null): UseStatsReturn {
  const [snapshot, setSnapshot] = useState<RTCStatsSnapshot | null>(null);
  const [history, setHistory] = useState<StatsHistory>(emptyHistory());
  const [quality, setQuality] = useState<ConnectionQuality>('connecting');
  const [isPolling, setIsPolling] = useState(false);
  const pollerRef = useRef<StatsPoller | null>(null);

  const startPolling = useCallback(() => {
    const pc = getPeerConnection();
    if (!pc || pollerRef.current) return;

    const poller = new StatsPoller(pc);
    pollerRef.current = poller;
    setIsPolling(true);

    poller.start(1000, (snap) => {
      setSnapshot(snap);
      setHistory((prev) => appendToHistory(prev, snap));
      const q = deriveConnectionQuality(snap.currentRoundTripTime, snap.packetsLostPercent);
      setQuality(q);
    });
  }, [getPeerConnection]);

  const stopPolling = useCallback(() => {
    pollerRef.current?.stop();
    pollerRef.current = null;
    setIsPolling(false);
  }, []);

  // Auto-start polling when a peer connection is available
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const pc = getPeerConnection();
      if (pc && !pollerRef.current) {
        startPolling();
      } else if (!pc && pollerRef.current) {
        stopPolling();
      }
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      stopPolling();
    };
  }, [getPeerConnection, startPolling, stopPolling]);

  return { snapshot, history, quality, isPolling };
}
