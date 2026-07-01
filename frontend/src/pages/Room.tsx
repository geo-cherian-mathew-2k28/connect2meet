import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Video, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { VideoGrid } from '@/components/meeting/VideoGrid';
import { Controls } from '@/components/meeting/Controls';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import { NetworkInspector } from '@/components/inspector/NetworkInspector';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useStats } from '@/hooks/useStats';
import { useChat } from '@/hooks/useChat';
import { useParticipants } from '@/hooks/useParticipants';
import { useMeetingStore } from '@/store/meetingStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { iceStateLabel } from '@/network/iceHelpers';
import type { NetworkFlowStage } from '@/types';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const store = useMeetingStore();
  const { settings, localUserId, isInspectorOpen, isChatOpen, isParticipantsPanelOpen } = store;

  const {
    localStream, remoteStreams, isMuted, isVideoOff, isScreenSharing,
    isHandRaised, connectionState, iceState, toggleMute, toggleVideo,
    startScreenShare, stopScreenShare, toggleHand, sendReaction, leaveRoom,
    getActivePeerConnection,
  } = useWebRTC(roomId ?? null, localUserId, settings.displayName);

  const { snapshot, history, quality } = useStats(getActivePeerConnection);
  const { messages, unreadCount, sendMessage, openChat, closeChat } = useChat(
    roomId ?? null, localUserId, settings.displayName
  );
  const { participants } = useParticipants(localStream, localUserId);

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleToggleChat = () => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
      store.setParticipantsPanelOpen(false);
    }
  };

  const handleToggleParticipants = () => {
    const next = !isParticipantsPanelOpen;
    store.setParticipantsPanelOpen(next);
    if (next) store.setChatOpen(false);
  };

  // Build local participant from store + state
  const localParticipant = {
    userId: localUserId,
    displayName: settings.displayName,
    isHost: store.isHost,
    isMuted,
    isVideoOff,
    isHandRaised,
    joinedAt: Date.now(),
    isSpeaking: false,
  };

  // All participants including local for panels
  const allParticipants = [localParticipant, ...participants.filter((p) => p.userId !== localUserId)];
  const remoteParticipants = participants.filter((p) => p.userId !== localUserId);

  if (!roomId) return null;

  return (
    <div className="h-screen flex flex-col bg-[#fafbfe] overflow-hidden text-slate-800 selection:bg-blue-100">
      {/* Top bar */}
      <div className="h-14 bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLeave}
            className="text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-slate-800 text-sm font-semibold tracking-tight">{roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
            {iceState === 'connected' || iceState === 'completed' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="text-xs text-slate-600 font-medium">
              {iceStateLabel(iceState ?? 'new')}
            </span>
          </div>

          {/* RTT ping */}
          {snapshot?.currentRoundTripTime != null && snapshot.currentRoundTripTime > 0 && (
            <Badge variant="default" className="text-xs border border-slate-200/85 text-slate-600 font-mono bg-white">
              {snapshot.currentRoundTripTime}ms
            </Badge>
          )}

          {/* Learning mode badge */}
          {settings.isLearningMode && (
            <Badge variant="blue" className="text-xs font-semibold">Learning Mode ON</Badge>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <VideoGrid
            localParticipant={localParticipant}
            localStream={localStream}
            remoteStreams={remoteStreams}
            participants={remoteParticipants}
            isScreenSharing={isScreenSharing}
            isInspectorOpen={isInspectorOpen}
          />

          {/* Controls */}
          <Controls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            isHandRaised={isHandRaised}
            unreadCount={unreadCount}
            isInspectorOpen={isInspectorOpen}
            isChatOpen={isChatOpen}
            isParticipantsPanelOpen={isParticipantsPanelOpen}
            participantCount={allParticipants.length}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            onToggleHand={toggleHand}
            onToggleChat={handleToggleChat}
            onToggleParticipants={handleToggleParticipants}
            onToggleInspector={() => store.setInspectorOpen(!isInspectorOpen)}
            onSendReaction={sendReaction}
            onLeave={handleLeave}
            roomId={roomId}
          />
        </div>

        {/* Side panels */}
        <AnimatePresence>
          {isChatOpen && (
            <ChatPanel
              key="chat"
              messages={messages}
              onSend={sendMessage}
              onClose={closeChat}
              localUserId={localUserId}
            />
          )}
          {isParticipantsPanelOpen && (
            <ParticipantsPanel
              key="participants"
              participants={allParticipants}
              localUserId={localUserId}
              isHost={store.isHost}
              onClose={() => store.setParticipantsPanelOpen(false)}
            />
          )}
          {isInspectorOpen && (
            <NetworkInspector
              key="inspector"
              snapshot={snapshot}
              history={history}
              quality={quality}
              isLearningMode={settings.isLearningMode}
              onClose={() => store.setInspectorOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating reactions */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {store.reactions.map((r) => (
            <motion.span
              key={r.id}
              className="text-3xl"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -60, scale: 1 }}
              exit={{ opacity: 0, y: -120, scale: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              {r.reaction}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
