import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Participant, ChatMessage, AppSettings, Reaction } from '@/types';

interface MeetingStore {
  // Room
  roomId: string | null;
  localUserId: string;
  isHost: boolean;
  hostId: string | null;

  // Participants
  participants: Record<string, Participant>;

  // Chat
  messages: ChatMessage[];
  unreadCount: number;
  isChatOpen: boolean;

  // Panels
  isParticipantsPanelOpen: boolean;
  isInspectorOpen: boolean;

  // Reactions
  reactions: Reaction[];

  // Settings
  settings: AppSettings;

  // Actions
  setRoom: (roomId: string, userId: string, isHost: boolean, hostId: string) => void;
  clearRoom: () => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, update: Partial<Participant>) => void;
  setParticipants: (participants: Participant[]) => void;
  addMessage: (msg: ChatMessage) => void;
  markChatRead: () => void;
  setChatOpen: (open: boolean) => void;
  setParticipantsPanelOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  addReaction: (r: Reaction) => void;
  removeReaction: (id: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
}

const generateUserId = () => `user-${Math.random().toString(36).slice(2, 9)}`;

const defaultSettings: AppSettings = {
  selectedCamera: '',
  selectedMicrophone: '',
  selectedSpeaker: '',
  videoQuality: 'medium',
  isDarkMode: false,
  isLearningMode: false,
  noiseSuppressionEnabled: true,
  backgroundBlurEnabled: false,
  displayName: `Guest-${Math.floor(Math.random() * 1000)}`,
};

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set) => ({
      roomId: null,
      localUserId: generateUserId(),
      isHost: false,
      hostId: null,
      participants: {},
      messages: [],
      unreadCount: 0,
      isChatOpen: false,
      isParticipantsPanelOpen: false,
      isInspectorOpen: true,
      reactions: [],
      settings: defaultSettings,

      setRoom: (roomId, userId, isHost, hostId) =>
        set({ roomId, localUserId: userId, isHost, hostId }),

      clearRoom: () =>
        set({
          roomId: null,
          isHost: false,
          hostId: null,
          participants: {},
          messages: [],
          unreadCount: 0,
          isChatOpen: false,
          isParticipantsPanelOpen: false,
        }),

      addParticipant: (p) =>
        set((state) => ({
          participants: { ...state.participants, [p.userId]: p },
        })),

      removeParticipant: (userId) =>
        set((state) => {
          const updated = { ...state.participants };
          delete updated[userId];
          return { participants: updated };
        }),

      updateParticipant: (userId, update) =>
        set((state) => ({
          participants: {
            ...state.participants,
            [userId]: { ...state.participants[userId], ...update },
          },
        })),

      setParticipants: (participants) =>
        set({
          participants: Object.fromEntries(participants.map((p) => [p.userId, p])),
        }),

      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, msg],
          unreadCount: state.isChatOpen ? 0 : state.unreadCount + 1,
        })),

      markChatRead: () => set({ unreadCount: 0 }),

      setChatOpen: (open) =>
        set({ isChatOpen: open, unreadCount: open ? 0 : undefined }),

      setParticipantsPanelOpen: (open) => set({ isParticipantsPanelOpen: open }),
      setInspectorOpen: (open) => set({ isInspectorOpen: open }),

      addReaction: (r) =>
        set((state) => ({ reactions: [...state.reactions, r] })),

      removeReaction: (id) =>
        set((state) => ({ reactions: state.reactions.filter((r) => r.id !== id) })),

      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
    }),
    {
      name: 'call2meet-settings',
      partialize: (state) => ({ settings: state.settings, localUserId: state.localUserId }),
    }
  )
);
