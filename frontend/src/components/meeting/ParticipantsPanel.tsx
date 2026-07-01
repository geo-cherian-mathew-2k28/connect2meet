import React from 'react';
import { motion } from 'framer-motion';
import { X, Crown, MicOff, VideoOff, Hand, Wifi, WifiOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { qualityColor } from '@/network/iceHelpers';
import type { Participant } from '@/types';

interface ParticipantsPanelProps {
  participants: Participant[];
  localUserId: string;
  isHost: boolean;
  onClose: () => void;
}

export function ParticipantsPanel({ participants, localUserId, isHost, onClose }: ParticipantsPanelProps) {
  return (
    <motion.div
      className="w-72 flex flex-col bg-white border-l border-slate-100 shrink-0"
      initial={{ x: 290 }}
      animate={{ x: 0 }}
      exit={{ x: 290 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">
          Participants <span className="text-slate-400 font-normal">({participants.length})</span>
        </h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose} id="btn-close-participants">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {participants.map((p) => {
          const isLocal = p.userId === localUserId;
          return (
            <div
              key={p.userId}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3 transition-colors',
                isLocal ? 'bg-blue-50' : 'hover:bg-slate-50'
              )}
            >
              {/* Avatar */}
              <div className="relative">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold',
                  isLocal ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                )}>
                  {(p.displayName || 'Guest').charAt(0).toUpperCase()}
                </div>
                {p.isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {p.displayName || 'Guest'}
                    {isLocal && <span className="text-slate-400"> (you)</span>}
                  </p>
                  {p.isHost && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {p.connectionQuality && !isLocal && (
                    <span className={cn('text-xs', qualityColor(p.connectionQuality))}>
                      {p.connectionQuality}
                    </span>
                  )}
                </div>
              </div>

              {/* Status icons */}
              <div className="flex items-center gap-1">
                {p.isSpeaking && <Volume2 className="w-3.5 h-3.5 text-green-500" />}
                {p.isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <span className="w-3.5 h-3.5 text-slate-300">
                    <Wifi className="w-full h-full" />
                  </span>
                )}
                {p.isVideoOff && <VideoOff className="w-3.5 h-3.5 text-slate-400" />}
                {p.isHandRaised && <span className="text-sm">✋</span>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
