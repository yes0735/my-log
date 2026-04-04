// Design Ref: §9.1 — Zustand auth store
// Design Ref: §9.4 — Logout with BE API call
import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  // Plan SC: 로그아웃 버튼 클릭 → Refresh Token 무효화 → /login 이동
  logout: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await axios.delete(`${baseURL}/auth/logout`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // BE 호출 실패해도 로컬 정리 진행
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
