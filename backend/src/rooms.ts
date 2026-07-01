import { Participant, Room } from './types';

/**
 * In-memory room manager.
 * Stores all active rooms and provides CRUD helpers.
 */
class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createOrGetRoom(roomId: string, hostId: string): Room {
    if (!this.rooms.has(roomId)) {
      const room: Room = {
        roomId,
        participants: new Map(),
        createdAt: Date.now(),
        hostId,
      };
      this.rooms.set(roomId, room);
      console.log(`[Room] Created room: ${roomId}`);
    }
    return this.rooms.get(roomId)!;
  }

  addParticipant(roomId: string, participant: Participant): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.set(participant.userId, participant);
      console.log(`[Room] ${participant.displayName} joined ${roomId} (${room.participants.size} participants)`);
    }
  }

  removeParticipant(roomId: string, userId: string): { roomDeleted: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { roomDeleted: false };

    room.participants.delete(userId);
    console.log(`[Room] User ${userId} left ${roomId} (${room.participants.size} remaining)`);

    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[Room] Deleted empty room: ${roomId}`);
      return { roomDeleted: true };
    }

    // Transfer host if host left
    if (room.hostId === userId && room.participants.size > 0) {
      const newHostId = room.participants.keys().next().value;
      if (newHostId) {
        room.hostId = newHostId;
        const newHost = room.participants.get(newHostId);
        if (newHost) newHost.isHost = true;
        console.log(`[Room] Host transferred to ${newHostId} in ${roomId}`);
      }
    }

    return { roomDeleted: false };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getParticipants(roomId: string): Participant[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.participants.values());
  }

  updateParticipantState(roomId: string, userId: string, state: Partial<Pick<Participant, 'isMuted' | 'isVideoOff' | 'isHandRaised'>>): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(userId);
    if (participant) {
      Object.assign(participant, state);
    }
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

export const roomManager = new RoomManager();
