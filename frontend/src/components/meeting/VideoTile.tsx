import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicOff, VideoOff, Hand, Wifi, WifiOff, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { qualityColor } from '@/network/iceHelpers';
import type { Participant } from '@/types';

interface VideoTileProps {
  participant: Participant;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isScreenShare?: boolean;
  className?: string;
}

export function VideoTile({ participant, stream, isLocal, isSpeaking, isScreenShare, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const quality = participant.connectionQuality;
  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled && !participant.isVideoOff);
  const displayName = participant.displayName || `Guest-${participant.userId.slice(-4)}`;

  return (
    <motion.div
      className={cn(
        'relative video-tile rounded-2xl overflow-hidden bg-white border border-slate-200/70 transition-all duration-300 shadow-sm',
        isSpeaking && 'ring-2 ring-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/40',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
    >
      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn('w-full h-full object-cover rounded-2xl', isScreenShare && 'screen-share')}
          style={{ transform: isLocal && !isScreenShare ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.6)_0%,rgba(241,245,249,0.9)_100%)]" />
          <motion.div 
            className="relative z-10 w-20 h-20 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 text-3xl font-bold shadow-sm"
            animate={isSpeaking ? { scale: [1, 1.05, 1], borderColor: '#10b981' } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {displayName.charAt(0).toUpperCase()}
          </motion.div>
        </div>
      )}

      {/* Subtle bottom gradient to make overlay legible */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />

      {/* Bottom info bar */}
      <div className="absolute bottom-3 left-3 right-3 p-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-slate-200/50 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-2 px-1">
          {participant.isHost && (
            <span className="bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
              <Crown className="w-3 h-3" />
            </span>
          )}
          <span className="text-slate-800 text-xs font-semibold truncate max-w-[110px]">
            {isLocal ? 'You' : displayName}
          </span>
          {isLocal && (
            <span className="text-slate-500 text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/30">LOCAL</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <AnimatePresence>
            {participant.isMuted && (
              <motion.span 
                className="bg-rose-50 text-rose-600 rounded-full p-1 shadow-sm border border-rose-100 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <MicOff className="w-3 h-3" />
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {participant.isVideoOff && (
              <motion.span 
                className="bg-slate-100 text-slate-500 rounded-full p-1 shadow-sm border border-slate-200/40 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <VideoOff className="w-3 h-3" />
              </motion.span>
            )}
          </AnimatePresence>

          {quality && !isLocal && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs flex items-center justify-center font-semibold border', qualityColor(quality))}>
              {quality === 'excellent' || quality === 'good' ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Hand raise indicator */}
      <AnimatePresence>
        {participant.isHandRaised && (
          <motion.div
            className="absolute top-3 right-3 bg-amber-500 text-white rounded-full p-2 shadow-md border border-amber-400/40 z-30"
            initial={{ scale: 0, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Hand className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
