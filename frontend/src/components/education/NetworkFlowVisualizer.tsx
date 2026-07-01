import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Server, Search, Globe, RefreshCw, Lock, Zap,
} from 'lucide-react';
import type { NetworkFlowStage } from '@/types';
import { cn } from '@/lib/utils';

interface NetworkFlowVisualizerProps {
  currentStage?: NetworkFlowStage;
  autoPlay?: boolean;
}

const STAGES: {
  id: NetworkFlowStage;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    id: 'signaling',
    label: 'Browser A',
    description: 'Your browser creates an SDP offer describing its media capabilities',
    icon: Monitor,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'signaling',
    label: 'Signaling Server',
    description: 'The Node.js + Socket.IO server relays the SDP offer/answer (does NOT touch media)',
    icon: Server,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 border-violet-200',
  },
  {
    id: 'ice-gathering',
    label: 'ICE Candidate Exchange',
    description: 'Both peers collect and share ICE candidates — possible network paths',
    icon: Search,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'stun',
    label: 'STUN Server',
    description: 'STUN tells each browser its public IP/port so peers can connect directly',
    icon: Globe,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
  },
  {
    id: 'turn',
    label: 'TURN Server (if needed)',
    description: 'If direct P2P fails due to NAT/firewall, TURN relays all data as fallback',
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'connecting',
    label: 'Peer Connection',
    description: 'RTCPeerConnection is established — DTLS handshake encrypts the channel',
    icon: Lock,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'connected',
    label: 'Encrypted Media (SRTP)',
    description: 'Video and audio flow peer-to-peer, encrypted with SRTP/DTLS-SRTP',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
];

export function NetworkFlowVisualizer({ currentStage, autoPlay = false }: NetworkFlowVisualizerProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!autoPlay) return;
    let idx = 0;
    const timer = setInterval(() => {
      setActiveIndex(idx);
      idx = (idx + 1) % STAGES.length;
    }, 2000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  // Map currentStage to index
  useEffect(() => {
    if (!currentStage) return;
    const stageOrder: NetworkFlowStage[] = [
      'signaling', 'ice-gathering', 'stun', 'turn', 'connecting', 'connected',
    ];
    const idx = stageOrder.indexOf(currentStage);
    if (idx !== -1) setActiveIndex(Math.min(idx * 1 + 1, STAGES.length - 1));
  }, [currentStage]);

  return (
    <div className="flex flex-col items-center gap-0 select-none">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;

        return (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border w-full max-w-md cursor-pointer transition-all duration-300',
                isActive ? stage.bgColor : 'bg-white border-slate-100',
                isCurrent && 'shadow-md ring-2 ring-offset-1',
                isCurrent && stage.bgColor
              )}
              style={{}}
              whileHover={{ scale: 1.01 }}
              onClick={() => setActiveIndex(i)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={cn('p-2 rounded-lg', isActive ? stage.bgColor : 'bg-slate-50')}>
                <Icon className={cn('w-4 h-4', isActive ? stage.color : 'text-slate-300')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', isActive ? stage.color : 'text-slate-400')}>
                  {stage.label}
                </p>
                <AnimatePresence>
                  {isCurrent && (
                    <motion.p
                      className="text-xs text-slate-500 mt-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {stage.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              {isCurrent && (
                <motion.div
                  className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', stage.color.replace('text-', 'bg-'))}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </motion.div>

            {/* Connector arrow */}
            {i < STAGES.length - 1 && (
              <div className="flex flex-col items-center my-0.5">
                <motion.div
                  className={cn('w-px h-5', isActive ? 'bg-blue-300' : 'bg-slate-200')}
                  animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <div className={cn('w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent', isActive ? 'border-t-blue-300' : 'border-t-slate-200')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
