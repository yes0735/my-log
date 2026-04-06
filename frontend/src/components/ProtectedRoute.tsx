import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const location = useLocation();
  const hasToken = !!localStorage.getItem('accessToken');
  const [status, setStatus] = useState<'checking' | 'ok' | 'unauthorized'>(
    isAuthenticated ? 'ok' : hasToken ? 'checking' : 'unauthorized'
  );

  useEffect(() => {
    if (isAuthenticated) {
      setStatus('ok');
      return;
    }
    if (!localStorage.getItem('accessToken')) {
      setStatus('unauthorized');
      return;
    }

    // 토큰은 있지만 스토어 미복원 → /auth/me로 세션 복원 시도
    // api.ts 인터셉터가 401 시 자동 refresh를 처리함
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        setStatus('ok');
      })
      .catch(() => {
        // refresh도 실패한 경우 — 토큰 정리 + 로그인 페이지
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setStatus('unauthorized');
      });
  }, [isAuthenticated, setUser, logout]);

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
