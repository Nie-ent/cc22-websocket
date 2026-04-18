// ============================================================
// components/chat/TypingIndicator.tsx
//
// แสดง "กำลังพิมพ์..." พร้อม animated dots
// ใช้ DaisyUI chat bubble + Tailwind animation
// ============================================================

interface Props {
  users: string[]; // รายชื่อคนที่กำลังพิมพ์
}

export default function TypingIndicator({ users }: Props) {
  // ถ้าไม่มีใครพิมพ์ → ไม่แสดงอะไร
  if (users.length === 0) return null;

  return (
    <div className="chat chat-start">
      <div className="chat-bubble chat-bubble-base-300 flex items-center gap-3 py-3">
        {/* Animated dots */}
        <span className="flex gap-1 items-center">
          <span className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
        <span className="text-xs text-base-content/60 italic">
          {users.join(', ')} กำลังพิมพ์...
        </span>
      </div>
    </div>
  );
}
