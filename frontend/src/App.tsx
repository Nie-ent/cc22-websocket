// ============================================================
// App.tsx — Root Component
//
// ทำหน้าที่ Auth-based routing:
// - มี token → แสดงหน้า Chat
// - ไม่มี token → แสดงหน้า Login
// ============================================================

import { useAuthStore } from './store/useAuthStore';
import LoginPage from './components/auth/LoginPage';
import ChatApp from './components/chat/ChatApp';

export default function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <ChatApp /> : <LoginPage />;
}
