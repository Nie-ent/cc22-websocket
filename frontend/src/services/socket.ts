// ============================================================
// services/socket.ts — Socket.IO Singleton
//
// ❗ Root Cause ของ bug "ค้าง":
//    เงื่อนไข socket.connected ใน getSocket ทำให้
//    ช่วง connecting (connected=false) มีการ disconnect
//    socket ตัวเก่าแล้วสร้างใหม่ → listeners หายไปกับ socket เก่า
//
// ✅ Fix: สร้าง socket ใหม่แค่เมื่อ token เปลี่ยน หรือ socket = null
//    Socket.IO จัดการ reconnect เองอยู่แล้ว ไม่ต้องช่วย
// ============================================================

import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

let socket: Socket | null = null;
let currentToken: string | null = null;




/**
 * คืน Socket instance เดิมถ้า token ยังเหมือนเดิม
 * สร้างใหม่เฉพาะเมื่อ token เปลี่ยน หรือ socket เป็น null
 */
export function getSocket(token: string): Socket {

  // ✅ ไม่เช็ค socket.connected เพราะช่วง connecting มัน false อยู่
  //    การเช็คทำให้ disconnect socket กลางอากาศแล้วสร้างใหม่ซ้ำๆ
  if (socket && currentToken === token) {
    return socket;
  }

  // Token เปลี่ยน → disconnect socket เก่า
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(BACKEND_URL, {
    auth: { token },         // ส่ง JWT ผ่าน handshake.auth.token
    reconnectionAttempts: 5, // Socket.IO จะ reconnect เองถ้าหลุด
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🟢 Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('🔴 Socket connect error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🟡 Socket disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
    console.log('⚫ Socket manually disconnected');
  }
}
