// ============================================================
// hooks/useSocket.ts — Custom Hook สำหรับ Socket.IO
//
// หน้าที่: ซ่อน Socket event handling complexity ไว้ที่นี่
// Component ที่ใช้ไม่ต้องรู้เรื่อง socket.on/off เลย
// ============================================================

import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import type { Message, Room } from '../types';

interface UseSocketReturn {
  connected: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  typingUsers: string[];
}

export function useSocket(currentRoom: Room | null): UseSocketReturn {
  const { token, user } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    // ✅ เก็บ reference ของแต่ละ handler
    // เพื่อให้ socket.off() ลบได้ถูกตัวตอน cleanup
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => {
        // Guard 1: ถ้า real id ซ้ำ → skip (ป้องกัน duplicate)
        if (prev.find((m) => m.id === msg.id)) return prev;

        // Guard 2: ถ้ามี optimistic message ที่ match → replace ด้วย real
        const optIdx = prev.findIndex(
          (m) =>
            m.isOptimistic &&
            m.sender.id === msg.sender.id &&
            m.content === msg.content &&
            m.roomId === msg.roomId
        );

        if (optIdx !== -1) {
          const updated = [...prev];
          updated[optIdx] = msg; // แทนที่ optimistic ด้วยข้อมูลจริงจาก DB
          return updated;
        }

        // ข้อความใหม่จากคนอื่น → append
        return [...prev, msg];
      });
    };

    const handleTypingUsers = (data: { roomId: number; users: string[] }) => {
      if (data.roomId === currentRoom?.id) {
        // กรองชื่อตัวเองออก — ไม่แสดงว่าตัวเองกำลังพิมพ์
        setTypingUsers(data.users.filter((u) => u !== user?.username));
      }
    };

    // ลงทะเบียน listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_users', handleTypingUsers);

    // ถ้า socket connected อยู่แล้ว (กรณี re-render) → set ทันที
    if (socket.connected) setConnected(true);

    // Cleanup: ลบ listener ออกตอน component unmount หรือ deps เปลี่ยน
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_users', handleTypingUsers);
    };
  }, [token, currentRoom?.id, user?.username]);

  return { connected, messages, setMessages, typingUsers };
}
