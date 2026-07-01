import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MessageSquare,
  Users, Activity, PhoneOff, Hand, Smile,
  Copy, Check, Share2, Subtitles, MoreVertical, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  unreadCount: number;
  isInspectorOpen: boolean;
  isChatOpen: boolean;
  isParticipantsPanelOpen: boolean;
  participantCount: number;
  isCaptionsEnabled?: boolean;
  onToggleCaptions?: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleInspector: () => void;
  onSendReaction: (emoji: string) => void;
  onLeave: () => void;
  roomId: string;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '👏', '🎉'];

export function Controls({
  isMuted, isVideoOff, isScreenSharing, isHandRaised,
  unreadCount, isInspectorOpen, isChatOpen, isParticipantsPanelOpen,
  participantCount, isCaptionsEnabled = false, onToggleCaptions,
  onToggleMute, onToggleVideo, onToggleScreenShare,
  onToggleHand, onToggleChat, onToggleParticipants, onToggleInspector,
  onSendReaction, onLeave, roomId,
}: ControlsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnClass = "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-sm";

  return (
    <>
      {/* ─── DESKTOP CONTROLS VIEW ─── */}
      <div className="hidden md:flex relative z-40 h-20 bg-white/90 backdrop-blur-md border-t border-slate-200/60 items-center justify-between px-8 shrink-0 select-none">
        {/* Left — room info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">Meeting ID</span>
            <span className="font-mono text-xs font-semibold text-slate-800">{roomId}</span>
          </div>
          <Tooltip content={copied ? 'Copied!' : 'Copy invite link'}>
            <button
              onClick={copyLink}
              id="btn-copy-link"
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        </div>

        {/* Center — core controls */}
        <div className="flex items-center gap-3">
          {/* Mute/Unmute */}
          <Tooltip content={isMuted ? 'Unmute microphone' : 'Mute microphone'}>
            <button
              id="btn-toggle-mute"
              onClick={onToggleMute}
              className={cn(
                btnClass,
                isMuted
                  ? "bg-rose-50 border-rose-100/80 text-rose-600 hover:bg-rose-100/60"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {isMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
            </button>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip content={isVideoOff ? 'Start video camera' : 'Stop video camera'}>
            <button
              id="btn-toggle-video"
              onClick={onToggleVideo}
              className={cn(
                btnClass,
                isVideoOff
                  ? "bg-rose-50 border-rose-100/80 text-rose-600 hover:bg-rose-100/60"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {isVideoOff ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
            </button>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip content={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}>
            <button
              id="btn-screen-share"
              onClick={onToggleScreenShare}
              className={cn(
                btnClass,
                isScreenSharing
                  ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Monitor className="w-4.5 h-4.5" />
            </button>
          </Tooltip>

          {/* Reactions */}
          <div className="relative">
            <Tooltip content="Send reaction">
              <button
                id="btn-reactions"
                onClick={() => setShowReactions(!showReactions)}
                className={cn(
                  btnClass,
                  showReactions
                    ? "bg-slate-100 border-slate-350 text-slate-900"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Smile className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-2 flex gap-1 z-50 backdrop-blur-md"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                >
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-2xl hover:scale-130 transition-transform p-1 cursor-pointer active:scale-95"
                      onClick={() => { onSendReaction(emoji); setShowReactions(false); }}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hand raise */}
          <Tooltip content={isHandRaised ? 'Lower hand' : 'Raise hand'}>
            <button
              id="btn-raise-hand"
              onClick={onToggleHand}
              className={cn(
                btnClass,
                isHandRaised
                  ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Hand className="w-4.5 h-4.5" />
            </button>
          </Tooltip>

          {/* Captions Toggle */}
          {onToggleCaptions && (
            <Tooltip content={isCaptionsEnabled ? 'Turn off captions' : 'Turn on captions'}>
              <button
                id="btn-captions"
                onClick={onToggleCaptions}
                className={cn(
                  btnClass,
                  isCaptionsEnabled
                    ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Subtitles className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
          )}

          {/* Leave */}
          <Tooltip content="Leave meeting">
            <button
              id="btn-leave"
              onClick={onLeave}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-md shadow-rose-200"
            >
              <PhoneOff className="w-4.5 h-4.5" />
            </button>
          </Tooltip>
        </div>

        {/* Right — panels */}
        <div className="flex items-center gap-3">
          {/* Chat */}
          <Tooltip content="Chat panel">
            <button
              id="btn-chat"
              onClick={onToggleChat}
              className={cn(
                btnClass,
                isChatOpen
                  ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <div className="relative">
                <MessageSquare className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
          </Tooltip>

          {/* Participants */}
          <Tooltip content="Participants list">
            <button
              id="btn-participants"
              onClick={onToggleParticipants}
              className={cn(
                btnClass,
                isParticipantsPanelOpen
                  ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <div className="relative">
                <Users className="w-4.5 h-4.5" />
                <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {participantCount}
                </span>
              </div>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ─── MOBILE CONTROLS VIEW (Google Meet Mobile Layout) ─── */}
      <div className="md:hidden relative z-40 h-24 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-6 shrink-0 select-none pb-4">
        {/* Video Camera Toggle */}
        <button
          onClick={onToggleVideo}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
            isVideoOff
              ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
              : "bg-slate-800 border border-slate-700 text-slate-200"
          )}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Microphone Toggle */}
        <button
          onClick={onToggleMute}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
            isMuted
              ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
              : "bg-slate-800 border border-slate-700 text-slate-200"
          )}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Hand Raise Toggle */}
        <button
          onClick={onToggleHand}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
            isHandRaised
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
              : "bg-slate-800 border border-slate-700 text-slate-200"
          )}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* More Options Menu Trigger */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-200 active:bg-slate-700 transition-all duration-200 cursor-pointer"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* End Call (Red Button) */}
        <button
          onClick={onLeave}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white active:scale-90 transition-all duration-200 cursor-pointer shadow-lg shadow-rose-900/30"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* ─── MOBILE SLIDING BOTTOM MENU DRAWER ─── */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
            />

            {/* Sliding Panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] border-t border-slate-200 z-50 p-6 pb-8 space-y-6 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.15)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              {/* Handlebar indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

              {/* Title & Close */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-sm font-bold text-slate-800 tracking-tight">Meeting Options</span>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Operations Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Share Link */}
                <button
                  onClick={() => {
                    copyLink();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 active:bg-slate-100 transition-colors">
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">{copied ? 'Copied!' : 'Share Invite'}</span>
                </button>

                {/* Screen Share */}
                <button
                  onClick={() => {
                    onToggleScreenShare();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full border flex items-center justify-center transition-colors active:scale-95",
                    isScreenSharing
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-slate-50 border-slate-200/80 text-slate-600"
                  )}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">
                    {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                  </span>
                </button>

                {/* Subtitles (CC) */}
                {onToggleCaptions && (
                  <button
                    onClick={() => {
                      onToggleCaptions();
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full border flex items-center justify-center transition-colors active:scale-95",
                      isCaptionsEnabled
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-slate-50 border-slate-200/80 text-slate-600"
                    )}>
                      <Subtitles className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-slate-600 font-semibold">Subtitles (CC)</span>
                  </button>
                )}

                {/* In-Call Chat */}
                <button
                  onClick={() => {
                    onToggleChat();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full border flex items-center justify-center transition-colors relative active:scale-95",
                    isChatOpen
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-slate-50 border-slate-200/80 text-slate-600"
                  )}>
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">In-call Chat</span>
                </button>

                {/* People / Participants */}
                <button
                  onClick={() => {
                    onToggleParticipants();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full border flex items-center justify-center transition-colors relative active:scale-95",
                    isParticipantsPanelOpen
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-slate-50 border-slate-200/80 text-slate-600"
                  )}>
                    <Users className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-slate-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                      {participantCount}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">People</span>
                </button>

                {/* Diagnostics Toggle */}
                <button
                  onClick={() => {
                    onToggleInspector();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full border flex items-center justify-center transition-colors active:scale-95",
                    isInspectorOpen
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-slate-50 border-slate-200/80 text-slate-600"
                  )}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">Diagnostics</span>
                </button>
              </div>

              {/* Horizontal Divider */}
              <div className="w-full h-px bg-slate-100 my-2" />

              {/* Reactions Slider */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block text-center">Send Reaction</span>
                <div className="flex items-center justify-between px-2">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSendReaction(emoji);
                        setIsMoreMenuOpen(false);
                      }}
                      className="text-3xl hover:scale-125 active:scale-90 transition-transform duration-200 cursor-pointer p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
