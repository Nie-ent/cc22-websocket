// ============================================================
// components/chat/MessageBubble.tsx
//
// Single message bubble โดยใช้ DaisyUI chat component
// - ข้อความของเรา → ขวา (chat-end) + สี primary
// - ข้อความคนอื่น → ซ้าย (chat-start) + avatar
// - Optimistic message → opacity ต่ำ แสดงว่ากำลังส่ง
// ============================================================

import type { Message, AuthUser } from '../../types';

interface Props {
  message: Message;
  currentUser: AuthUser | null;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message, currentUser }: Props) {
  const isMe = message.sender.id === currentUser?.id;

  return (
    <div className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
      {/* Avatar — แสดงเฉพาะข้อความคนอื่น */}
      {!isMe && (
        <div className="chat-image avatar placeholder">
          <div className="w-8 h-8 rounded-full bg-neutral text-neutral-content">
            <span className="text-xs font-bold">
              {message.sender.username[0].toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* ชื่อผู้ส่ง — แสดงเฉพาะข้อความคนอื่น */}
      {!isMe && (
        <div className="chat-header text-xs mb-1 opacity-60">
          {message.sender.username}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          chat-bubble
          ${isMe ? 'chat-bubble-primary' : ''}
          ${message.isOptimistic ? 'opacity-60' : ''}
        `}
      >
        {message.content}
      </div>

      {/* เวลา */}
      <div className="chat-footer text-xs opacity-40 mt-1">
        {message.isOptimistic ? '⏱ กำลังส่ง...' : formatTime(message.createdAt)}
      </div>
    </div>
  );
}
