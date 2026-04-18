// ============================================================
// components/chat/ChatSidebar.tsx
//
// Sidebar แสดง: App brand, User info, Room list, Logout
// ใช้ DaisyUI menu component สำหรับรายการห้อง
// ============================================================

import { Hash, Lock, LogOut, MessageSquare } from 'lucide-react';
import type { Room, AuthUser } from '../../types';

// Map ชื่อห้อง → Icon
const ROOM_ICONS: Record<string, React.ReactNode> = {
  General: <Hash size={15} />,
  Secret: <Lock size={15} />,
};

interface Props {
  rooms: Room[];
  currentRoom: Room | null;
  onRoomChange: (room: Room) => void;
  currentUser: AuthUser | null;
  connected: boolean;
  onLogout: () => void;
}

export default function ChatSidebar({
  rooms,
  currentRoom,
  onRoomChange,
  currentUser,
  connected,
  onLogout,
}: Props) {
  return (
    <aside className="w-64 bg-base-200 flex flex-col border-r border-base-300 shrink-0">
      {/* ---- Brand ---- */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">ChatSpace</span>
        </div>
      </div>

      {/* ---- User Info ---- */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar placeholder">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-content">
              <span className="font-bold text-sm">
                {currentUser?.username[0].toUpperCase()}
              </span>
            </div>
          </div>

          {/* Name + Status */}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">
              {currentUser?.username}
            </span>
            <span
              className={`text-xs flex items-center gap-1.5 ${
                connected ? 'text-success' : 'text-error'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? 'bg-success' : 'bg-error'
                }`}
              />
              {connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Room List ---- */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="text-xs font-semibold text-base-content/40 px-3 py-2 tracking-widest uppercase">
          Channels
        </div>

        <ul className="menu menu-sm gap-0.5">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                className={`flex items-center gap-2 ${
                  currentRoom?.id === room.id ? 'active' : ''
                }`}
                onClick={() => onRoomChange(room)}
              >
                {ROOM_ICONS[room.name] ?? <Hash size={15} />}
                <span>{room.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ---- Logout ---- */}
      <div className="p-2 border-t border-base-300">
        <button
          className="btn btn-ghost btn-sm w-full justify-start text-error hover:bg-error/10"
          onClick={onLogout}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
