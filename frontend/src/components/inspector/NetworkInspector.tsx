import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ChevronRight, Wifi, Zap,
  Radio, Shield, Monitor, Clock, TrendingUp, Info, Cpu, HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { StatsGraphs } from './StatsGraphs';
import { ConnectionQualityGauge } from './ConnectionQualityGauge';
import { candidateTypeLabel, formatBitrate, formatMs, iceStateLabel } from '@/network/iceHelpers';
import type { RTCStatsSnapshot, StatsHistory, ConnectionQuality } from '@/types';
import { cn } from '@/lib/utils';

interface NetworkInspectorProps {
  snapshot: RTCStatsSnapshot | null;
  history: StatsHistory;
  quality: ConnectionQuality;
  isLearningMode: boolean;
  onClose: () => void;
}

const LEARNING_TIPS: Record<string, string> = {
  ice: 'Interactive Connectivity Establishment (ICE) negotiates the best network route between peers.',
  candidates: 'Host (LAN IP), Reflexive (STUN public IP discovered behind NAT), Relay (TURN server connection fallback).',
  bitrate: 'Data transfer speed. Higher bandwidth enables richer resolutions and framerates.',
  rtt: 'Round Trip Time is the ping latency to your peer and back. Lower latency ensures smoother, lag-free interaction.',
  jitter: 'Packet arrival variation. High jitter causes packet reordering and voice stutter.',
  codec: 'Compresses audio/video. VP8/H.264 are standard video encoders; Opus is optimal for hi-fi audio.',
  dtls: 'DTLS is SSL/TLS for UDP. It verifies peer authenticity and establishes encryption keys.',
};

interface StatCardProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ElementType;
  tip?: string;
  isLearningMode?: boolean;
}

function StatCard({ label, value, icon: Icon, tip, isLearningMode }: StatCardProps) {
  return (
    <div className="relative p-3 rounded-xl bg-slate-50 border border-slate-200/50 flex flex-col justify-between hover:bg-slate-100/50 transition-colors">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
        {isLearningMode && tip && (
          <Tooltip content={<span className="max-w-[200px] block text-wrap text-xs leading-normal">{tip}</span>} side="top">
            <Info className="w-3 h-3 text-blue-500 cursor-help shrink-0" />
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-500/80 shrink-0" />}
        <span className="text-xs font-semibold text-slate-800 tracking-wide truncate max-w-[130px]">
          {value}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 border-t border-slate-100 first:border-t-0 first:pt-0">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
  );
}

function iceStateBadge(state: RTCIceConnectionState | null) {
  if (!state) return <Badge className="bg-slate-100 text-slate-400 border-slate-200">None</Badge>;
  const colors: Record<string, string> = {
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    checking: 'bg-blue-50 text-blue-700 border-blue-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    disconnected: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const color = colors[state] || 'bg-slate-100 text-slate-600 border-slate-200';
  return <Badge variant="default" className={cn("border text-[10px]", color)}>{iceStateLabel(state)}</Badge>;
}

export function NetworkInspector({ snapshot, history, quality, isLearningMode, onClose }: NetworkInspectorProps) {
  const [showGraphs, setShowGraphs] = useState(true);

  return (
    <motion.div
      className="w-80 flex flex-col bg-white border-l border-slate-200/60 shrink-0 overflow-hidden text-slate-700 select-none z-20 shadow-xl"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-650" />
          <h3 className="font-bold text-slate-900 tracking-tight text-sm">System Diagnostics</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {isLearningMode && (
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-full">LEARNING</span>
          )}
          <button
            onClick={onClose}
            id="btn-close-inspector"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Quality gauge */}
        <ConnectionQualityGauge
          quality={quality}
          rtt={snapshot?.currentRoundTripTime ?? 0}
          packetLoss={snapshot?.packetsLostPercent ?? 0}
        />

        {/* Connection States */}
        <div className="space-y-2">
          <SectionHeader icon={Radio} title="Connection State" />
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="ICE Status"
              value={iceStateBadge(snapshot?.iceConnectionState ?? null)}
              tip={LEARNING_TIPS.ice}
              isLearningMode={isLearningMode}
            />
            <StatCard
              label="DTLS Cipher"
              value={snapshot?.dtlsState || 'Negotiating'}
              icon={Shield}
              tip={LEARNING_TIPS.dtls}
              isLearningMode={isLearningMode}
            />
          </div>
        </div>

        {/* ICE Candidates */}
        <div className="space-y-2">
          <SectionHeader icon={Cpu} title="NAT Traversal" />
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Local ICE Type"
              value={candidateTypeLabel(snapshot?.localCandidateType ?? 'unknown')}
              tip={LEARNING_TIPS.candidates}
              isLearningMode={isLearningMode}
            />
            <StatCard
              label="Remote ICE Type"
              value={candidateTypeLabel(snapshot?.remoteCandidateType ?? 'unknown')}
              tip={LEARNING_TIPS.candidates}
              isLearningMode={isLearningMode}
            />
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1.5 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Protocol:</span>
              <span className="text-slate-700 font-bold uppercase">{snapshot?.localCandidateProtocol || 'UDP'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Local EP:</span>
              <span className="text-slate-600 truncate max-w-[170px]" title={snapshot?.localCandidateAddress}>{snapshot?.localCandidateAddress || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Remote EP:</span>
              <span className="text-slate-600 truncate max-w-[170px]" title={snapshot?.remoteCandidateAddress}>{snapshot?.remoteCandidateAddress || '—'}</span>
            </div>
          </div>
        </div>

        {/* Video & Media stats */}
        <div className="space-y-2">
          <SectionHeader icon={Monitor} title="Media Streams" />
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Resolution"
              value={snapshot?.frameWidth ? `${snapshot.frameWidth}×${snapshot.frameHeight}` : 'Camera Off'}
              icon={Monitor}
            />
            <StatCard
              label="Frame Rate"
              value={snapshot?.framesPerSecond ? `${snapshot.framesPerSecond.toFixed(0)} FPS` : '0 FPS'}
              icon={TrendingUp}
            />
            <StatCard
              label="Active Codec"
              value={snapshot?.codec || 'Opus / VP8'}
              icon={HardDrive}
              tip={LEARNING_TIPS.codec}
              isLearningMode={isLearningMode}
            />
            <StatCard
              label="Out Bitrate"
              value={formatBitrate(snapshot?.videoBitrateKbps ?? 0)}
              icon={Zap}
              tip={LEARNING_TIPS.bitrate}
              isLearningMode={isLearningMode}
            />
          </div>
        </div>

        {/* Latency Metrics */}
        <div className="space-y-2">
          <SectionHeader icon={Clock} title="Latency Metrics" />
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Network Ping"
              value={formatMs(snapshot?.currentRoundTripTime ?? 0)}
              icon={Clock}
              tip={LEARNING_TIPS.rtt}
              isLearningMode={isLearningMode}
            />
            <StatCard
              label="Audio Jitter"
              value={formatMs(snapshot?.jitterMs ?? 0)}
              icon={Activity}
              tip={LEARNING_TIPS.jitter}
              isLearningMode={isLearningMode}
            />
          </div>
        </div>

        {/* Collapsible Graphs */}
        <div className="border-t border-slate-100 pt-3">
          <button
            className="w-full flex items-center justify-between py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors cursor-pointer"
            onClick={() => setShowGraphs(!showGraphs)}
          >
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Live Charts
            </span>
            <ChevronRight className={cn('w-3.5 h-3.5 transition-transform text-slate-400', showGraphs && 'rotate-90')} />
          </button>
          <AnimatePresence>
            {showGraphs && (
              <motion.div
                className="pt-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <StatsGraphs history={history} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
