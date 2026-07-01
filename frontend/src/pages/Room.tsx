import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Video, Wifi, WifiOff, ArrowLeft, ShieldCheck, Loader2, Lock, Activity } from 'lucide-react';
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

  const [hasLeft, setHasLeft] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const {
    localStream, remoteStreams, isMuted, isVideoOff, isScreenSharing,
    isHandRaised, connectionState, iceState, toggleMute, toggleVideo,
    startScreenShare, stopScreenShare, toggleHand, sendReaction, leaveRoom,
    getActivePeerConnection, admissionStatus, pendingAdmissions, respondToAdmission,
    isCaptionsEnabled, captions, toggleCaptions,
  } = useWebRTC(roomId ?? null, localUserId, settings.displayName);

  const { snapshot, history, quality } = useStats(getActivePeerConnection);
  const { messages, unreadCount, sendMessage, openChat, closeChat } = useChat(
    roomId ?? null, localUserId, settings.displayName
  );
  const { participants } = useParticipants(localStream, localUserId);

  useEffect(() => {
    if (!hasLeft) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasLeft, navigate]);

  const handleLeave = () => {
    leaveRoom();
    setHasLeft(true);
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

  if (hasLeft) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafbfe] text-slate-800 p-6">
        <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-2xl p-8 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200/50 rounded-full flex items-center justify-center mx-auto text-slate-500 shadow-sm">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">You left the meeting</h1>
            <p className="text-sm text-slate-500 font-medium">Returning to home screen in {countdown} seconds...</p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-slate-200 hover:bg-slate-50 font-semibold px-5"
            >
              Return to home
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 shadow-sm"
            >
              Rejoin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (admissionStatus === 'waiting') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafbfe] text-slate-800 p-6">
        <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-2xl p-8 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-blue-50/50 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-sm">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Asking to join...</h1>
            <p className="text-sm text-slate-500 font-medium">Someone in the meeting will let you in shortly.</p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleLeave}
              className="border-slate-200 hover:bg-slate-50 font-semibold px-5"
            >
              Cancel request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (admissionStatus === 'denied') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafbfe] text-slate-800 p-6">
        <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-2xl p-8 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-rose-50/80 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">You can't join this meeting</h1>
            <p className="text-sm text-slate-500 font-medium">The host has denied your request to join.</p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => navigate('/')}
              className="bg-slate-950 hover:bg-slate-900 text-white font-semibold px-5"
            >
              Return to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fafbfe] overflow-hidden text-slate-800 selection:bg-blue-100 relative">
      {/* Host admission approval notifications */}
      {store.isHost && pendingAdmissions.length > 0 && (
        <div className="absolute top-16 right-4 z-50 w-80 space-y-2 pointer-events-auto">
          {pendingAdmissions.map((req) => (
            <div
              key={req.socketId}
              className="bg-white border border-slate-200 shadow-lg rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top duration-300"
            >
              <div>
                <p className="text-slate-800 text-sm font-semibold">Someone wants to join</p>
                <p className="text-slate-500 text-xs truncate font-medium">{req.displayName} wants to join this meeting.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => respondToAdmission(req.socketId, false)}
                  className="text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Deny
                </Button>
                <Button
                  size="sm"
                  onClick={() => respondToAdmission(req.socketId, true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Admit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top bar */}
      <div className="h-14 bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-3 md:px-6 shrink-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2 md:gap-3">
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

          {/* E2EE Lock Indicator */}
          <div className="flex items-center gap-1.5 ml-1 md:ml-2 cursor-help" title="High Security End-to-End Encrypted (DTLS-SRTP)">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span className="hidden md:inline-block text-[10px] text-emerald-700 bg-emerald-50/50 border border-emerald-100/60 font-bold px-1.5 py-0.5 rounded">SECURE</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Connection status (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
            {iceState === 'connected' || iceState === 'completed' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="text-xs text-slate-600 font-medium">
              {iceStateLabel(iceState ?? 'new')}
            </span>
          </div>

          {/* RTT ping (hidden on mobile) */}
          {snapshot?.currentRoundTripTime != null && snapshot.currentRoundTripTime > 0 && (
            <Badge variant="default" className="hidden md:inline-flex text-xs border border-slate-200/85 text-slate-600 font-mono bg-white">
              {snapshot.currentRoundTripTime}ms
            </Badge>
          )}

          {/* Learning mode badge (hidden on mobile) */}
          {settings.isLearningMode && (
            <Badge variant="blue" className="hidden md:inline-flex text-xs font-semibold">Learning Mode ON</Badge>
          )}

          <div className="hidden md:block w-px h-4 bg-slate-200" />

          {/* Network Inspector Toggle button in header corner (hidden on mobile) */}
          <Button
            variant={isInspectorOpen ? "default" : "outline"}
            size="sm"
            onClick={() => store.setInspectorOpen(!isInspectorOpen)}
            className="hidden md:flex text-xs font-semibold items-center gap-1.5 h-8 border-slate-250 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            Diagnostics
          </Button>
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

          {/* Real-time Captions Overlay */}
          {isCaptionsEnabled && captions.length > 0 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 pointer-events-none z-30 space-y-2">
              <AnimatePresence>
                {captions.map((cap: { userId: string; displayName: string; text: string; id: string }) => (
                  <motion.div
                    key={cap.id}
                    className="bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-center shadow-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 block mb-0.5">{cap.displayName}</span>
                    <p className="text-sm font-semibold tracking-wide">{cap.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

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
            isCaptionsEnabled={isCaptionsEnabled}
            onToggleCaptions={toggleCaptions}
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
