import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { roomManager } from './rooms';
import {
  JoinRoomPayload,
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  ChatMessagePayload,
  PeerStatePayload,
  Participant,
} from './types';

dotenv.config();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    timestamp: new Date().toISOString(),
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Map: socketId → { userId, roomId }
const socketUserMap = new Map<string, { userId: string; roomId: string }>();

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ─── JOIN ROOM ────────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomId, userId, displayName }: JoinRoomPayload) => {
    // Get or create room; first joiner is host
    const existingRoom = roomManager.getRoom(roomId);
    const isHost = !existingRoom;

    const room = roomManager.createOrGetRoom(roomId, userId);

    const participant: Participant = {
      userId,
      displayName,
      isHost,
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false,
      joinedAt: Date.now(),
    };

    // Get existing participants BEFORE adding the new one (for signaling)
    const existingParticipants = roomManager.getParticipants(roomId);

    roomManager.addParticipant(roomId, participant);
    socket.join(roomId);
    socketUserMap.set(socket.id, { userId, roomId });

    // Tell the new user about everyone already in the room
    socket.emit('room-joined', {
      roomId,
      participants: existingParticipants,
      isHost,
      hostId: room.hostId,
    });

    // Tell everyone else a new user joined (they'll initiate offers)
    socket.to(roomId).emit('user-joined', {
      userId,
      displayName,
      isHost: false,
    });

    console.log(`[Signaling] ${displayName} (${userId}) joined room ${roomId}`);
  });

  // ─── WEBRTC SIGNALING ─────────────────────────────────────────────────────

  socket.on('offer', ({ targetUserId, callerId, sdp }: OfferPayload) => {
    // Find the socket of the target user
    const targetSocketId = findSocketByUserId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', { callerId, sdp });
    }
  });

  socket.on('answer', ({ targetUserId, callerId, sdp }: AnswerPayload) => {
    const targetSocketId = findSocketByUserId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', { callerId, sdp });
    }
  });

  socket.on('ice-candidate', ({ targetUserId, callerId, candidate }: IceCandidatePayload) => {
    const targetSocketId = findSocketByUserId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { callerId, candidate });
    }
  });

  // ─── CHAT ─────────────────────────────────────────────────────────────────

  socket.on('chat-message', (payload: ChatMessagePayload) => {
    // Broadcast to everyone in the room EXCEPT sender
    socket.to(payload.roomId).emit('chat-message', payload);
  });

  // ─── PEER STATE (mute, video, hand raise, reaction) ───────────────────────

  socket.on('peer-state', (payload: PeerStatePayload) => {
    const info = socketUserMap.get(socket.id);
    if (!info) return;
    const { roomId } = info;

    roomManager.updateParticipantState(roomId, payload.userId, {
      isMuted: payload.isMuted,
      isVideoOff: payload.isVideoOff,
      isHandRaised: payload.isHandRaised,
    });

    // Relay to everyone else in the room
    socket.to(roomId).emit('peer-state', payload);
  });

  socket.on('reaction', (payload: { userId: string; reaction: string }) => {
    const info = socketUserMap.get(socket.id);
    if (!info) return;
    socket.to(info.roomId).emit('reaction', payload);
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const info = socketUserMap.get(socket.id);
    if (info) {
      const { userId, roomId } = info;
      const { roomDeleted } = roomManager.removeParticipant(roomId, userId);
      socketUserMap.delete(socket.id);

      if (!roomDeleted) {
        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit('user-disconnected', {
          userId,
          hostId: room?.hostId,
        });
      }
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });

  socket.on('leave-room', () => {
    const info = socketUserMap.get(socket.id);
    if (info) {
      const { userId, roomId } = info;
      const { roomDeleted } = roomManager.removeParticipant(roomId, userId);
      socket.leave(roomId);
      socketUserMap.delete(socket.id);

      if (!roomDeleted) {
        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit('user-disconnected', {
          userId,
          hostId: room?.hostId,
        });
      }
    }
  });
});

// Helper: find socket ID by userId
function findSocketByUserId(userId: string): string | undefined {
  for (const [socketId, info] of socketUserMap.entries()) {
    if (info.userId === userId) return socketId;
  }
  return undefined;
}

server.listen(PORT, () => {
  console.log(`\n🚀 WebRTC Signaling Server running on port ${PORT}`);
  console.log(`   CORS: ${CLIENT_URL}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
