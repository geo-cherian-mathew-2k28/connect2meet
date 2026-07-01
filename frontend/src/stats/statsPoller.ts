import type { RTCStatsSnapshot, StatsHistory } from '@/types';

const MAX_HISTORY = 60; // 60 data points = 60 seconds at 1s interval

/**
 * Polls peerConnection.getStats() every intervalMs and calls onStats with parsed snapshot.
 */
export class StatsPoller {
  private pc: RTCPeerConnection;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private prevBytesSent = 0;
  private prevBytesRecv = 0;
  private prevAudioBytesSent = 0;
  private prevTimestamp = 0;
  private prevPacketsLost = 0;
  private prevPacketsSent = 0;

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  start(intervalMs: number, onStats: (snapshot: RTCStatsSnapshot) => void): void {
    this.intervalId = setInterval(async () => {
      try {
        const snapshot = await this.poll();
        onStats(snapshot);
      } catch (e) {
        // Peer connection may have closed
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<RTCStatsSnapshot> {
    const stats = await this.pc.getStats();
    const now = Date.now();

    let snapshot: RTCStatsSnapshot = {
      iceConnectionState: this.pc.iceConnectionState,
      connectionState: this.pc.connectionState,
      signalingState: this.pc.signalingState,
      iceGatheringState: this.pc.iceGatheringState,
      localCandidateType: 'unknown',
      remoteCandidateType: 'unknown',
      localCandidateAddress: '',
      remoteCandidateAddress: '',
      localCandidateProtocol: 'unknown',
      dtlsState: 'unknown',
      currentRoundTripTime: 0,
      videoBitrateKbps: 0,
      audioBitrateKbps: 0,
      availableOutgoingBitrateKbps: 0,
      packetsLost: 0,
      packetsLostPercent: 0,
      jitterMs: 0,
      frameWidth: 0,
      frameHeight: 0,
      framesPerSecond: 0,
      codec: '',
      timestamp: now,
    };

    // Maps to look up candidates
    const localCandidates = new Map<string, RTCStatsReport>();
    const remoteCandidates = new Map<string, RTCStatsReport>();

    stats.forEach((report) => {
      if (report.type === 'local-candidate') localCandidates.set(report.id, report);
      if (report.type === 'remote-candidate') remoteCandidates.set(report.id, report);
    });

    let activePairId: string | null = null;

    stats.forEach((report: any) => {
      switch (report.type) {
        case 'candidate-pair': {
          if (report.state === 'succeeded' || report.nominated) {
            activePairId = report.id;
            const dt = (now - this.prevTimestamp) / 1000;
            if (dt > 0 && this.prevTimestamp > 0) {
              const videoBytes = report.bytesSent || 0;
              const audioBytes = report.bytesReceived || 0;
              snapshot.videoBitrateKbps = Math.round(((videoBytes - this.prevBytesSent) * 8) / dt / 1000);
              snapshot.audioBitrateKbps = Math.round(((audioBytes - this.prevBytesRecv) * 8) / dt / 1000);
              this.prevBytesSent = videoBytes;
              this.prevBytesRecv = audioBytes;
            }
            snapshot.currentRoundTripTime = Math.round((report.currentRoundTripTime || 0) * 1000);
            snapshot.availableOutgoingBitrateKbps = Math.round((report.availableOutgoingBitrate || 0) / 1000);

            // Look up candidates
            const local = localCandidates.get(report.localCandidateId) as any;
            const remote = remoteCandidates.get(report.remoteCandidateId) as any;
            if (local) {
              snapshot.localCandidateType = local.candidateType || 'unknown';
              snapshot.localCandidateAddress = `${local.address || local.ip || ''}:${local.port || ''}`;
              snapshot.localCandidateProtocol = local.protocol || 'unknown';
            }
            if (remote) {
              snapshot.remoteCandidateType = remote.candidateType || 'unknown';
              snapshot.remoteCandidateAddress = `${remote.address || remote.ip || ''}:${remote.port || ''}`;
            }
          }
          break;
        }

        case 'outbound-rtp': {
          if (report.kind === 'video') {
            snapshot.frameWidth = report.frameWidth || 0;
            snapshot.frameHeight = report.frameHeight || 0;
            snapshot.framesPerSecond = report.framesPerSecond || 0;

            const lostDelta = (report.packetsLost || 0) - this.prevPacketsLost;
            const sentDelta = (report.packetsSent || 0) - this.prevPacketsSent;
            snapshot.packetsLost = report.packetsLost || 0;
            snapshot.packetsLostPercent = sentDelta > 0 ? Math.min(100, (lostDelta / sentDelta) * 100) : 0;
            this.prevPacketsLost = report.packetsLost || 0;
            this.prevPacketsSent = report.packetsSent || 0;
          }
          break;
        }

        case 'inbound-rtp': {
          if (report.kind === 'video') {
            snapshot.jitterMs = Math.round((report.jitter || 0) * 1000);
            if (!snapshot.frameWidth) {
              snapshot.frameWidth = report.frameWidth || 0;
              snapshot.frameHeight = report.frameHeight || 0;
              snapshot.framesPerSecond = report.framesPerSecond || 0;
            }
          }
          break;
        }

        case 'codec': {
          if (report.mimeType) {
            const codec = report.mimeType.split('/')[1] || '';
            if (codec && !snapshot.codec) snapshot.codec = codec.toUpperCase();
          }
          break;
        }

        case 'transport': {
          snapshot.dtlsState = report.dtlsState || 'unknown';
          break;
        }
      }
    });

    this.prevTimestamp = now;
    return snapshot;
  }
}

// Keep a rolling history of stats
export function appendToHistory(history: StatsHistory, snap: RTCStatsSnapshot): StatsHistory {
  const push = <T>(arr: T[], val: T, max: number): T[] => {
    const next = [...arr, val];
    return next.length > max ? next.slice(next.length - max) : next;
  };

  return {
    timestamps: push(history.timestamps, snap.timestamp, MAX_HISTORY),
    videoBitrate: push(history.videoBitrate, snap.videoBitrateKbps, MAX_HISTORY),
    audioBitrate: push(history.audioBitrate, snap.audioBitrateKbps, MAX_HISTORY),
    rtt: push(history.rtt, snap.currentRoundTripTime, MAX_HISTORY),
    packetsLostPercent: push(history.packetsLostPercent, snap.packetsLostPercent, MAX_HISTORY),
    fps: push(history.fps, snap.framesPerSecond, MAX_HISTORY),
    jitter: push(history.jitter, snap.jitterMs, MAX_HISTORY),
  };
}

export const emptyHistory = (): StatsHistory => ({
  timestamps: [],
  videoBitrate: [],
  audioBitrate: [],
  rtt: [],
  packetsLostPercent: [],
  fps: [],
  jitter: [],
});
