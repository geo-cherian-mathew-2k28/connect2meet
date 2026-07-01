import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { VideoTile } from './VideoTile';
import type { Participant } from '@/types';

interface VideoGridProps {
  localParticipant: Participant;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: Participant[];
  isScreenSharing?: boolean;
  isInspectorOpen?: boolean;
}

function getCardSizeClass(count: number, isInspectorOpen: boolean): string {
  if (count === 1) {
    return 'w-full max-w-[760px] aspect-video';
  }
  if (count === 2) {
    return isInspectorOpen 
      ? 'w-full max-w-[480px] aspect-video'
      : 'w-[calc(50%-8px)] min-w-[280px] max-w-[560px] aspect-video';
  }
  // 3 or more
  return isInspectorOpen
    ? 'w-[calc(50%-8px)] min-w-[240px] max-w-[380px] aspect-video'
    : 'w-[calc(33.33%-12px)] min-w-[260px] max-w-[460px] aspect-video';
}

export function VideoGrid({
  localParticipant,
  localStream,
  remoteStreams,
  participants,
  isScreenSharing,
  isInspectorOpen = false,
}: VideoGridProps) {
  const allParticipants = [localParticipant, ...participants];
  const count = allParticipants.length;
  const sizeClass = getCardSizeClass(count, isInspectorOpen);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 min-h-0 overflow-y-auto">
      <div className="w-full flex flex-wrap gap-4 items-center justify-center">
        <AnimatePresence>
          {/* Local tile */}
          <VideoTile
            key="local"
            participant={localParticipant}
            stream={localStream}
            isLocal
            isSpeaking={localParticipant.isSpeaking}
            isScreenShare={isScreenSharing}
            className={sizeClass}
          />

          {/* Remote tiles */}
          {participants.map((p) => (
            <VideoTile
              key={p.userId}
              participant={p}
              stream={remoteStreams.get(p.userId)}
              isSpeaking={p.isSpeaking}
              className={sizeClass}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
