// ============================================================
// components/auth/LoginPage.tsx
//
// หน้า Login + Register ใช้ DaisyUI card + tabs
// - toast แทน error text inline (ใช้ react-toastify)
// - ปุ่ม Quick Test สำหรับ seed users
// ============================================================

import { useState } from 'react';
import { LogIn, UserPlus, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';

const API = 'http://localhost:3001';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        await axios.post(`${API}/auth/register`, { username, password });
        toast.success('สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย 🎉');
        setMode('login');
        return;
      }

      const res = await axios.post(`${API}/auth/login`, { username, password });
      setAuth(res.data.token, res.data.user);
      toast.success(`ยินดีต้อนรับ ${res.data.user.username}! 👋`);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const fillUser = (name: string) => {
    setUsername(name);
    setPassword('password123');
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md">
        <div className="card-body gap-5">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <MessageSquare size={40} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">ChatSpace</h1>
            <p className="text-base-content/50 text-sm">
              Real-time chat powered by Socket.IO
            </p>
          </div>

          {/* Mode Tabs */}
          <div role="tablist" className="tabs tabs-boxed">
            <button
              role="tab"
              className={`tab flex-1 ${mode === 'login' ? 'tab-active' : ''}`}
              onClick={() => setMode('login')}
            >
              เข้าสู่ระบบ
            </button>
            <button
              role="tab"
              className={`tab flex-1 ${mode === 'register' ? 'tab-active' : ''}`}
              onClick={() => setMode('register')}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control gap-1">
              <label className="label py-0">
                <span className="label-text font-medium">ชื่อผู้ใช้</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น alice, bob"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-control gap-1">
              <label className="label py-0">
                <span className="label-text font-medium">รหัสผ่าน</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={17} />
                  เข้าสู่ระบบ
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  สมัครสมาชิก
                </>
              )}
            </button>
          </form>

          {/* Quick Test Users */}
          <div className="divider text-xs text-base-content/30 my-0">
            ทดสอบด่วน (seed users)
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline flex-1"
              onClick={() => fillUser('alice')}
            >
              👩 alice
            </button>
            <button
              className="btn btn-sm btn-outline flex-1"
              onClick={() => fillUser('bob')}
            >
              👨 bob
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
