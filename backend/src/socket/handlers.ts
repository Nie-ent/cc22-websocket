import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { UserPayload } from '../middleware/auth';

const prisma = new PrismaClient();

// Track users typing per room: roomId -> Set of usernames
const typingUsers: Map<string, Set<string>> = new Map();

export function registerSocketHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user as UserPayload;

  console.log(`✅ [Socket] ${user.username} connected (${socket.id})`);

  // ---- join_room ----
  // Client ส่ง: socket.emit('join_room', roomId)
  socket.on('join_room', async (roomId: number) => {
    const roomName = roomId.toString();

    // console.log('socket.rooms', [...socket.rooms].filter(r => r !== socket.id))

    // ออกจากห้องเก่าทั้งหมดก่อน (ยกเว้น socket.id เองที่ join อัตโนมัติ)
    const currentRooms = [...socket.rooms].filter((r) => r !== socket.id);
    for (const room of currentRooms) {
      socket.leave(room);
      // ล้าง typing status ของ user ในห้องนั้น
      removeTyping(io, room, user.username);
    }

    socket.join(roomName);
    console.log(`📌 [Room] ${user.username} joined room ${roomName}`);

    // แจ้งคนในห้องว่ามีคนใหม่เข้ามา
    socket.to(roomName).emit('user_joined', {
      username: user.username,
      roomId,
    });
  });

  // ---- send_message ----
  // Client ส่ง: socket.emit('send_message', { roomId, content })
  socket.on('send_message', async (data: { roomId: number; content: string }) => {
    if (!data.content?.trim()) return;

    try {
      // บันทึกลง MySQL ผ่าน Prisma
      const savedMessage = await prisma.message.create({
        data: {
          content: data.content.trim(),
          senderId: user.userId,   // อ่านจาก JWT ไม่ใช่จาก Client
          roomId: data.roomId,
        },
        include: {
          sender: {
            select: { id: true, username: true },
          },
        },
      });

      const roomName = data.roomId.toString();

      // Broadcast ไปยังทุกคนในห้อง (รวม sender)
      io.to(roomName).emit('receive_message', savedMessage);

      // หยุด typing indicator หลังส่งข้อความสำเร็จ
      removeTyping(io, roomName, user.username);

    } catch (error) {
      console.error('❌ [send_message] Error:', error);
      socket.emit('error_message', { error: 'Failed to save message' });
    }
  });

  // ---- typing ----
  // Client ส่ง: socket.emit('typing', { roomId, isTyping: true/false })
  socket.on('typing', (data: { roomId: number; isTyping: boolean }) => {
    const roomName = data.roomId.toString();

    if (data.isTyping) {
      addTyping(io, roomName, user.username);
    } else {
      removeTyping(io, roomName, user.username);
    }
  });

  // ---- disconnect ----
  socket.on('disconnect', () => {
    console.log(`❌ [Socket] ${user.username} disconnected`);

    // ล้าง typing status ในทุกห้องที่ user เคยอยู่
    const currentRooms = [...socket.rooms].filter((r) => r !== socket.id);
    for (const room of currentRooms) {
      removeTyping(io, room, user.username);
    }
  });
}

// ---- Typing Helpers ----
function addTyping(io: Server, roomName: string, username: string): void {
  if (!typingUsers.has(roomName)) {
    typingUsers.set(roomName, new Set());
  }
  typingUsers.get(roomName)!.add(username);
  broadcastTyping(io, roomName);
}

function removeTyping(io: Server, roomName: string, username: string): void {
  typingUsers.get(roomName)?.delete(username);
  broadcastTyping(io, roomName);
}

function broadcastTyping(io: Server, roomName: string): void {
  const users = [...(typingUsers.get(roomName) || [])];
  // ส่งไปให้ทุกคนในห้อง (รับฝั่ง Client: socket.on('typing_users', ...))
  io.to(roomName).emit('typing_users', { roomId: Number(roomName), users });
}
