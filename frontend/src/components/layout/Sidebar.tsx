// Design Ref: §5.1 — Sidebar navigation layout (responsive)
import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import {
  IoBookOutline,
  IoStatsChartOutline,
  IoCreateOutline,
  IoCalendarOutline,
  IoFlagOutline,
  IoPeopleOutline,
  IoTrophyOutline,
  IoSettingsOutline,
  IoCloseOutline,
  IoNewspaperOutline,
  IoPodiumOutline,
  IoLogOutOutline,
} from 'react-icons/io5';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: IoStatsChartOutline },
  { to: '/books', label: '내 서재', icon: IoBookOutline },
  { to: '/records', label: '독서 기록', icon: IoCalendarOutline },
  { to: '/reviews', label: '독후감', icon: IoCreateOutline },
  { to: '/stats', label: '통계', icon: IoStatsChartOutline },
  { to: '/goals', label: '목표', icon: IoFlagOutline },
  { divider: true } as const,
  { to: '/feed', label: '타임라인', icon: IoNewspaperOutline },
  { to: '/community', label: '커뮤니티', icon: IoPeopleOutline },
  { to: '/challenges', label: '챌린지', icon: IoTrophyOutline },
  { to: '/leaderboard', label: '리더보드', icon: IoPodiumOutline },
  { divider: true } as const,
  { to: '/settings', label: '설정', icon: IoSettingsOutline },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const location = useLocation();

  // 모바일에서 페이지 이동 시 사이드바 자동 닫힘
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile, setSidebarOpen]);

  // 모바일: 오버레이 사이드바
  if (isMobile) {
    return (
      <>
        {/* 백드롭 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* 슬라이드 패널 */}
        <aside
          className={cn(
            'fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <span className="text-xl font-bold text-primary">📚 MyLog</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 hover:bg-secondary"
              aria-label="Close sidebar"
            >
              <IoCloseOutline className="h-5 w-5" />
            </button>
          </div>
          <NavList />
        </aside>
      </>
    );
  }

  // 데스크톱: 고정 사이드바 (접힘/펼침)
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-card transition-all duration-300 md:block',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-xl font-bold text-primary">
          {sidebarOpen ? '📚 MyLog' : '📚'}
        </span>
      </div>
      <NavList collapsed={!sidebarOpen} />
    </aside>
  );
}

function NavList({ collapsed = false }: { collapsed?: boolean }) {
  const logout = useAuthStore((s) => s.logout);

  return (
    <nav className="flex h-[calc(100vh-3.5rem)] flex-col gap-1 p-2">
      <div className="flex-1 space-y-1">
        {navItems.map((item, i) => {
          if ('divider' in item) {
            return <hr key={i} className="my-2 border-border" />;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Design Ref: §9.5 — Logout button at Sidebar bottom */}
      <div className="border-t border-border pt-2">
        <button
          onClick={async () => {
            await logout();
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted
                     hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <IoLogOutOutline className="h-5 w-5 shrink-0" />
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </nav>
  );
}
