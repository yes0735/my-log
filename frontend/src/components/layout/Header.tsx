import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { IoMenuOutline, IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useState, useEffect } from 'react';

export default function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const { user, isAuthenticated } = useAuthStore();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const handleMenuClick = () => {
    if (isMobile) setSidebarOpen(true);
    else toggleSidebar();
  };

  return (
    <header className="sticky top-0 z-30 flex h-11 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button onClick={handleMenuClick} className="rounded p-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]" aria-label="Toggle sidebar">
          <IoMenuOutline className="h-[14px] w-[14px] text-muted opacity-60" />
        </button>
        {isMobile && <span className="text-sm font-semibold">MyLog</span>}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={() => setDark(!dark)}
          className="rounded p-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]" aria-label="Toggle dark mode">
          {dark ? <IoSunnyOutline className="h-[14px] w-[14px] text-muted opacity-60" /> : <IoMoonOutline className="h-[14px] w-[14px] text-muted opacity-60" />}
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <span className="hidden text-[13px] text-muted sm:inline">{user?.nickname}</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {user?.nickname?.[0]}
            </div>
          </div>
        ) : (
          <a href="/login" className="rounded-md bg-primary px-3 py-1 text-[13px] text-primary-foreground hover:bg-primary/90">로그인</a>
        )}
      </div>
    </header>
  );
}
