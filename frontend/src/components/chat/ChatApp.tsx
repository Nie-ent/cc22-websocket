// ============================================================
// components/chat/ChatApp.tsx
//
// Main container ของ Chat Feature
// หน้าที่: จัดการ State และประสานงานระหว่าง child components
//
// Data Flow:
//   useSocket hook → messages/connected/typingUsers
//   ChatApp → setMessages (optimistic) / socket.emit
//   ChatSidebar ← rooms, currentRoom, user info
//   MessageList ← messages, typingUsers
//   ChatInput ← callbacks สำหรับ typing + send
// ============================================================

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Hash, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

import { getSocket, disconnectSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocket } from '../../hooks/useSocket';
import type { Room, Message } from '../../types';

import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const API = 'http://localhost:3001';

const ROOM_ICONS: Record<string, React.ReactNode> = {
  General: <Hash size={18} />,
  Secret: <Lock size={18} />,
};

export default function ChatApp() {
  const { token, user, clearAuth } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // useSocket hook จัดการทุก Socket event ให้เรา
  const { connected, messages, setMessages, typingUsers } = useSocket(currentRoom);

  // ---- โหลดรายการห้อง ----
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setRooms(res.data);
        if (res.data.length > 0) setCurrentRoom(res.data[0]);
      })
      .catch(() => toast.error('ไม่สามารถโหลดรายการห้องได้'));
  }, [token]);

  // ---- Join Room + โหลด History ----
  useEffect(() => {
    if (!token || !currentRoom) return;
    const socket = getSocket(token);

    // บอก Server ว่าเข้าห้องนี้แล้ว
    socket.emit('join_room', currentRoom.id);

    // โหลดประวัติข้อความของห้องนี้
    setMessages([]);
    axios
      .get(`${API}/messages/${currentRoom.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch(() => toast.error('ไม่สามารถโหลดข้อความได้'));
  }, [token, currentRoom?.id]);

  // ---- ส่งข้อความ (Optimistic Update) ----
  const handleSend = (content: string): boolean => {
    if (!token || !currentRoom || !user) return false; // guard ไม่ผ่าน → แจ้ง ChatInput

    const socket = getSocket(token);

    // แสดงข้อความทันที ไม่รอ server → UX ดีขึ้น
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      roomId: currentRoom.id,
      sender: { id: user.id, username: user.username },
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // ส่งไปยัง Server จริงๆ
    socket.emit('send_message', { roomId: currentRoom.id, content });
    return true; // ✅ สำเร็จ → ChatInput จะ clear input
  };


  // ---- Typing Indicator ----
  const handleTypingStart = () => {
    if (!token || !currentRoom) return;
    getSocket(token).emit('typing', { roomId: currentRoom.id, isTyping: true });
  };

  const handleTypingStop = () => {
    if (!token || !currentRoom) return;
    getSocket(token).emit('typing', { roomId: currentRoom.id, isTyping: false });
  };

  // ---- Logout ----
  const handleLogout = () => {
    disconnectSocket();
    clearAuth();
    toast.info('ออกจากระบบแล้ว');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-base-100">
      {/* Sidebar */}
      <ChatSidebar
        rooms={rooms}
        currentRoom={currentRoom}
        onRoomChange={setCurrentRoom}
        currentUser={user}
        connected={connected}
        onLogout={handleLogout}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-base-300 flex items-center gap-3 bg-base-100 shrink-0">
          <div className="text-primary">
            {currentRoom ? ROOM_ICONS[currentRoom.name] ?? <Hash size={18} /> : null}
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">
              {currentRoom?.name ?? 'Select a room'}
            </h2>
            <p className="text-xs text-base-content/40">Real-time chat</p>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          typingUsers={typingUsers}
          currentUser={user}
          currentRoomName={currentRoom?.name}
        />

        {/* Input */}
        <ChatInput
          currentRoom={currentRoom}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onSend={handleSend}
        />
      </main>
    </div>
  );
}
