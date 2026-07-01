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
  const count = participants.length + 1; // total participants

  // Choose desktop grid classes
  let desktopGridClass = '';
  if (count === 1) {
    desktopGridClass = 'md:grid-cols-1 md:max-w-[800px]';
  } else if (count === 2) {
    desktopGridClass = 'md:grid-cols-2 md:max-w-[1100px]';
  } else if (count === 3) {
    desktopGridClass = 'md:grid-cols-2 lg:grid-cols-3 md:max-w-[1300px]';
  } else if (count === 4) {
    desktopGridClass = 'md:grid-cols-2 lg:grid-cols-4 md:max-w-[1400px]';
  } else {
    desktopGridClass = 'md:grid-cols-3 lg:grid-cols-4 md:max-w-[1600px]';
  }

  // Adjust desktop grid if inspector is open
  if (isInspectorOpen) {
    if (count === 2) {
      desktopGridClass = 'md:grid-cols-1 md:max-w-[500px]';
    } else if (count >= 3) {
      desktopGridClass = 'md:grid-cols-2 md:max-w-[850px]';
    }
  }

  // Mobile layout condition:
  // If count > 1, the remote participants are in a mobile grid, and local user is floating in the corner.
  const isMobilePiPActive = count > 1;

  // Mobile grid column count for remote participants
  let mobileRemoteGridClass = '';
  if (participants.length === 1) {
    mobileRemoteGridClass = 'grid-cols-1 max-w-sm';
  } else if (participants.length === 2) {
    mobileRemoteGridClass = 'grid-cols-1 max-w-sm';
  } else {
    mobileRemoteGridClass = 'grid-cols-2 max-w-md';
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 md:p-6 min-h-0 overflow-y-auto select-none">
      
      {/* Desktop view: Standard grid containing both local and remote tiles */}
      <div className={`hidden md:grid w-full ${desktopGridClass} gap-4 items-center justify-center`}>
        <AnimatePresence>
          <VideoTile
            key="local"
            participant={localParticipant}
            stream={localStream}
            isLocal
            isSpeaking={localParticipant.isSpeaking}
            isScreenShare={isScreenSharing}
            className="w-full h-full aspect-video"
          />
          {participants.map((p) => (
            <VideoTile
              key={p.userId}
              participant={p}
              stream={remoteStreams.get(p.userId)}
              isSpeaking={p.isSpeaking}
              className="w-full h-full aspect-video"
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile view: Optimized Google Meet Mobile UI */}
      <div className="md:hidden w-full h-full relative flex items-center justify-center">
        {isMobilePiPActive ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-1">
            {/* Remotes grid */}
            <div className={`w-full grid ${mobileRemoteGridClass} gap-3 items-center justify-center`}>
              <AnimatePresence>
                {participants.map((p) => (
                  <VideoTile
                    key={p.userId}
                    participant={p}
                    stream={remoteStreams.get(p.userId)}
                    isSpeaking={p.isSpeaking}
                    className="w-full h-full aspect-video"
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Local participant floating Picture-in-Picture window */}
            <div className="absolute bottom-2 right-2 z-30 w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/95 bg-slate-900 transition-all duration-300">
              <VideoTile
                key="local-floating"
                participant={localParticipant}
                stream={localStream}
                isLocal
                isSpeaking={localParticipant.isSpeaking}
                isScreenShare={isScreenSharing}
                className="w-full h-full border-none shadow-none rounded-none aspect-[3/4]"
              />
            </div>
          </div>
        ) : (
          /* Only local user in meeting */
          <div className="w-full max-w-sm">
            <VideoTile
              key="local-solo"
              participant={localParticipant}
              stream={localStream}
              isLocal
              isSpeaking={localParticipant.isSpeaking}
              isScreenShare={isScreenSharing}
              className="w-full h-full aspect-video"
            />
          </div>
        )}
      </div>

    </div>
  );
}
