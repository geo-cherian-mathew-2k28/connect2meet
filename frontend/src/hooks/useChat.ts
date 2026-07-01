import { useEffect, useCallback } from 'react';
import { getSocket } from '@/socket';
import { useMeetingStore } from '@/store/meetingStore';
import type { ChatMessage } from '@/types';

// uuid is available via crypto.randomUUID in modern browsers
const genId = () => (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36));

export function useChat(roomId: string | null, userId: string, displayName: string) {
  const socket = getSocket();
  const { messages, unreadCount, isChatOpen, addMessage, markChatRead, setChatOpen } = useMeetingStore();

  // Listen for incoming messages
  useEffect(() => {
    const handler = (payload: ChatMessage) => {
      addMessage({ ...payload, isOwn: payload.userId === userId });
    };
    socket.on('chat-message', handler);
    return () => { socket.off('chat-message', handler); };
  }, [socket, userId, addMessage]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!roomId || !message.trim()) return;
      const payload: ChatMessage = {
        id: genId(),
        userId,
        displayName,
        message: message.trim(),
        timestamp: Date.now(),
        isOwn: true,
      };
      addMessage(payload);
      socket.emit('chat-message', { ...payload, roomId });
    },
    [roomId, userId, displayName, socket, addMessage]
  );

  const openChat = useCallback(() => {
    setChatOpen(true);
    markChatRead();
  }, [setChatOpen, markChatRead]);

  const closeChat = useCallback(() => {
    setChatOpen(false);
  }, [setChatOpen]);

  return { messages, unreadCount, isChatOpen, sendMessage, openChat, closeChat };
}
