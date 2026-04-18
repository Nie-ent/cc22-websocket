// ============================================================
// components/chat/MessageList.tsx
//
// Container ที่แสดงรายการข้อความทั้งหมดและ typing indicator
// จัดการ auto-scroll ไปที่ข้อความล่าสุดอัตโนมัติ
// ============================================================

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Message, AuthUser } from '../../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface Props {
  messages: Message[];
  typingUsers: string[];
  currentUser: AuthUser | null;
  currentRoomName?: string;
}

export default function MessageList({
  messages,
  typingUsers,
  currentUser,
  currentRoomName,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom เมื่อมีข้อความใหม่หรือ typing เปลี่ยน
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Empty state
  if (messages.length === 0 && typingUsers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-base-content/30 p-8">
        <MessageSquare size={48} strokeWidth={1} />
        <p className="text-center text-sm">
          ยังไม่มีข้อความใน <strong>{currentRoomName || 'ห้องนี้'}</strong>
          <br />
          เป็นคนแรกที่พูดสิ! 👋
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
      {messages.map((msg) => (
        <MessageBubble
          key={String(msg.id)}
          message={msg}
          currentUser={currentUser}
        />
      ))}

      {/* Typing indicator อยู่ล่างสุด */}
      <TypingIndicator users={typingUsers} />

      {/* Anchor สำหรับ auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
