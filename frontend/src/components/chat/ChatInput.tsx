// ============================================================
// components/chat/ChatInput.tsx
//
// Input area สำหรับพิมพ์และส่งข้อความ
// - ส่งด้วย Enter หรือปุ่ม Send
// - แจ้ง parent ผ่าน callback เมื่อพิมพ์/หยุดพิมพ์/ส่ง
// - ไม่ handle Socket โดยตรง → ให้ parent จัดการ
// ============================================================

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import type { Room } from '../../types';

interface Props {
  currentRoom: Room | null;
  onTypingStart: () => void; // เรียกเมื่อเริ่มพิมพ์
  onTypingStop: () => void;  // เรียกเมื่อหยุดพิมพ์
  onSend: (content: string) => boolean; // return true = ส่งสำเร็จ
}

export default function ChatInput({
  currentRoom,
  onTypingStart,
  onTypingStop,
  onSend,
}: Props) {
  const [message, setMessage] = useState('');
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setMessage(value);

    if (!value.trim()) {
      onTypingStop();
      return;
    }

    // แจ้งว่าเริ่มพิมพ์ + reset timer
    onTypingStart();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      onTypingStop(); // หยุดพิมพ์นาน 2 วิ → แจ้งว่าหยุดแล้ว
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // ถ้า onSend return false (เช่น guard ไม่ผ่าน) → ไม่ clear input
    const success = onSend(trimmed);
    if (success) {
      setMessage('');
      onTypingStop();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    }
  };

  return (
    <div className="border-t border-base-300 p-4">
      <div className="flex gap-2">
        <input
          id="message-input"
          type="text"
          className="input input-bordered flex-1"
          placeholder={`ส่งข้อความใน ${currentRoom?.name ?? '...'}  (Enter เพื่อส่ง)`}
          value={message}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          id="send-btn"
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!message.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
