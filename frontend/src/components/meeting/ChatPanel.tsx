import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smile, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  onClose: () => void;
  localUserId: string;
}

const QUICK_EMOJIS = ['👍', '😂', '❤️', '🎉', '🙏', '🔥'];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ messages, onSend, onClose, localUserId }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="w-full md:w-80 flex flex-col bg-white border-l border-slate-100 shrink-0 fixed md:relative inset-0 md:inset-auto z-50"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="md:hidden text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-slate-800">Chat</h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} id="btn-close-chat" className="hidden md:flex">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-8">
            <p>No messages yet.</p>
            <p className="mt-1">Say hi! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === localUserId;
            return (
              <motion.div
                key={msg.id}
                className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {!isOwn && (
                  <span className="text-xs text-slate-400 mb-1 px-1">{msg.displayName}</span>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  )}
                >
                  {msg.message}
                </div>
                <span className="text-xs text-slate-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Quick emojis */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            className="px-4 pb-2 flex gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                className="text-xl hover:scale-125 transition-transform"
                onClick={() => { onSend(e); setShowEmoji(false); }}
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowEmoji(!showEmoji)}
          id="btn-emoji-picker"
        >
          <Smile className="w-4 h-4" />
        </Button>
        <Input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Send a message..."
          className="flex-1"
        />
        <Button
          variant="default"
          size="icon-sm"
          onClick={handleSend}
          disabled={!input.trim()}
          id="btn-send-chat"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
