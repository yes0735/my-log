import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser } = useAuthStore();
  const location = useLocation();
  const [checking, setChecking] = useState(!isAuthenticated && !!localStorage.getItem('accessToken'));

  // 토큰이 있지만 스토어가 초기화 안 된 경우 (새로고침) → /auth/me로 복원
  useEffect(() => {
    if (isAuthenticated || !localStorage.getItem('accessToken')) {
      setChecking(false);
      return;
    }

    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        setChecking(false);
      })
      .catch(() => {
        // 인터셉터가 refresh 실패 시 이미 /login으로 이동하므로
        // 여기서는 checking만 해제 (토큰 삭제는 인터셉터에 위임)
        setChecking(false);
      });
  }, [isAuthenticated, setUser]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated && !localStorage.getItem('accessToken')) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
