import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { VideoTile } from './VideoTile';
import { cn } from '@/lib/utils';
import type { Participant } from '@/types';

interface VideoGridProps {
  localParticipant: Participant;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: Participant[];
  isScreenSharing?: boolean;
  isInspectorOpen?: boolean;
}

function getGridClass(count: number): string {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function VideoGrid({
  localParticipant,
  localStream,
  remoteStreams,
  participants,
  isScreenSharing,
  isInspectorOpen,
}: VideoGridProps) {
  const allParticipants = [localParticipant, ...participants];
  const count = allParticipants.length;

  return (
    <div
      className={cn(
        'flex-1 grid gap-2 p-3 min-h-0',
        getGridClass(count),
        isInspectorOpen && count <= 2 && 'grid-cols-1 max-w-xl mx-auto'
      )}
    >
      <AnimatePresence>
        {/* Local tile */}
        <VideoTile
          key="local"
          participant={localParticipant}
          stream={localStream}
          isLocal
          isSpeaking={localParticipant.isSpeaking}
          isScreenShare={isScreenSharing}
        />

        {/* Remote tiles */}
        {participants.map((p) => (
          <VideoTile
            key={p.userId}
            participant={p}
            stream={remoteStreams.get(p.userId)}
            isSpeaking={p.isSpeaking}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
