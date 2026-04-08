import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser } = useAuthStore();
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'ok' | 'unauthorized'>('checking');

  useEffect(() => {
    // 이미 인증됨
    if (isAuthenticated) {
      setStatus('ok');
      return;
    }

    // 토큰 없음 → 즉시 로그인
    if (!localStorage.getItem('accessToken')) {
      setStatus('unauthorized');
      return;
    }

    // 토큰 있지만 스토어 미복원 → /auth/me로 복원 시도
    setStatus('checking');
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        setStatus('ok');
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setStatus('unauthorized');
      });
  }, [isAuthenticated, setUser]);

  // 로그아웃 또는 토큰 만료 감지 — isAuthenticated가 false로 바뀌면 재체크
  useEffect(() => {
    if (!isAuthenticated && status === 'ok') {
      if (!localStorage.getItem('accessToken')) {
        setStatus('unauthorized');
      }
    }
  }, [isAuthenticated, status]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
