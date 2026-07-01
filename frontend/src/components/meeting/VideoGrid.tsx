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

  let gridClass = '';
  if (count === 1) {
    gridClass = 'grid-cols-1 max-w-[800px]';
  } else if (count === 2) {
    gridClass = 'grid-cols-1 sm:grid-cols-2 max-w-[1100px]';
  } else if (count === 3) {
    gridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[1300px]';
  } else if (count === 4) {
    gridClass = 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 max-w-[1400px]';
  } else {
    gridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-[1600px]';
  }

  // Adjust for open inspector panel
  if (isInspectorOpen) {
    if (count === 2) {
      gridClass = 'grid-cols-1 max-w-[500px]';
    } else if (count >= 3) {
      gridClass = 'grid-cols-1 sm:grid-cols-2 max-w-[850px]';
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-3 md:p-6 min-h-0 overflow-y-auto">
      <div className={`w-full grid ${gridClass} gap-3 md:gap-4 items-center justify-center`}>
        <AnimatePresence>
          {/* Local tile */}
          <VideoTile
            key="local"
            participant={localParticipant}
            stream={localStream}
            isLocal
            isSpeaking={localParticipant.isSpeaking}
            isScreenShare={isScreenSharing}
            className="w-full h-full"
          />

          {/* Remote tiles */}
          {participants.map((p) => (
            <VideoTile
              key={p.userId}
              participant={p}
              stream={remoteStreams.get(p.userId)}
              isSpeaking={p.isSpeaking}
              className="w-full h-full"
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
