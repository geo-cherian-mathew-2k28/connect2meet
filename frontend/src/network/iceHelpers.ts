/**
 * ICE/SDP utility helpers for educational display and signaling.
 */

// Parse candidate type from SDP candidate string
export function parseCandidateType(candidate: string): 'host' | 'srflx' | 'relay' | 'unknown' {
  if (candidate.includes('typ host')) return 'host';
  if (candidate.includes('typ srflx')) return 'srflx';
  if (candidate.includes('typ relay')) return 'relay';
  return 'unknown';
}

export function candidateTypeLabel(type: 'host' | 'srflx' | 'relay' | 'unknown'): string {
  switch (type) {
    case 'host': return 'Host (LAN)';
    case 'srflx': return 'Server Reflexive (STUN)';
    case 'relay': return 'Relayed (TURN)';
    default: return 'Unknown';
  }
}

// Parse protocol from candidate
export function parseCandidateProtocol(candidate: string): 'udp' | 'tcp' | 'unknown' {
  if (/ udp /i.test(candidate)) return 'udp';
  if (/ tcp /i.test(candidate)) return 'tcp';
  return 'unknown';
}

// Format SDP for educational display — extract key lines
export function extractSdpHighlights(sdp: string): { section: string; lines: string[] }[] {
  const sections: { section: string; lines: string[] }[] = [];
  let current: { section: string; lines: string[] } | null = null;

  for (const line of sdp.split('\r\n')) {
    if (line.startsWith('m=')) {
      if (current) sections.push(current);
      current = { section: line, lines: [] };
    } else if (current) {
      if (
        line.startsWith('a=ice') ||
        line.startsWith('a=fingerprint') ||
        line.startsWith('a=setup') ||
        line.startsWith('a=rtpmap') ||
        line.startsWith('a=fmtp') ||
        line.startsWith('a=candidate')
      ) {
        current.lines.push(line);
      }
    } else {
      // Session level
      if (!current) {
        current = { section: 'Session', lines: [] };
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}

// Generate a random room ID (8 chars, human-readable)
export function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [4, 4].map((len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return segments.join('-');
}

// Derive connection quality from stats
export function deriveConnectionQuality(
  rttMs: number,
  packetsLostPercent: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rttMs < 50 && packetsLostPercent < 0.5) return 'excellent';
  if (rttMs < 120 && packetsLostPercent < 2) return 'good';
  if (rttMs < 300 && packetsLostPercent < 5) return 'fair';
  return 'poor';
}

// Quality badge color
export function qualityColor(quality: string): string {
  switch (quality) {
    case 'excellent': return 'text-emerald-600 bg-emerald-50';
    case 'good': return 'text-blue-600 bg-blue-50';
    case 'fair': return 'text-amber-600 bg-amber-50';
    case 'poor': return 'text-red-600 bg-red-50';
    default: return 'text-slate-500 bg-slate-100';
  }
}

// Format bytes to human-readable
export function formatBitrate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${kbps.toFixed(0)} Kbps`;
}

// Format ms
export function formatMs(ms: number): string {
  return `${ms.toFixed(0)} ms`;
}

// Clamp a value in range
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

// ICE connection state → human readable
export function iceStateLabel(state: RTCIceConnectionState): string {
  switch (state) {
    case 'new': return 'Initializing';
    case 'checking': return 'Checking Candidates';
    case 'connected': return 'Connected';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    case 'disconnected': return 'Disconnected';
    case 'closed': return 'Closed';
    default: return state;
  }
}

// Media quality presets
export const VIDEO_QUALITY_CONSTRAINTS: Record<string, { width: number; height: number; frameRate: number }> = {
  low: { width: 640, height: 360, frameRate: 15 },
  medium: { width: 1280, height: 720, frameRate: 30 },
  high: { width: 1920, height: 1080, frameRate: 30 },
};
