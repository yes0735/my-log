import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
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
  IoChevronForwardOutline,
  IoChevronBackOutline,
  IoGridOutline,
} from 'react-icons/io5';
import { useEffect } from 'react';

const navSections = [
  {
    label: '개인',
    items: [
      { to: '/dashboard', label: '대시보드', icon: IoGridOutline },
      { to: '/books', label: '내 서재', icon: IoBookOutline },
      { to: '/records', label: '독서 기록', icon: IoCalendarOutline },
      { to: '/reviews', label: '독후감', icon: IoCreateOutline },
      { to: '/stats', label: '통계', icon: IoStatsChartOutline },
      { to: '/goals', label: '목표', icon: IoFlagOutline },
    ],
  },
  {
    label: '커뮤니티',
    items: [
      { to: '/feed', label: '타임라인', icon: IoNewspaperOutline },
      { to: '/community', label: '커뮤니티', icon: IoPeopleOutline },
      { to: '/challenges', label: '챌린지', icon: IoTrophyOutline },
      { to: '/leaderboard', label: '리더보드', icon: IoPodiumOutline },
    ],
  },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const location = useLocation();

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile, setSidebarOpen]);

  // 모바일: 오버레이
  if (isMobile) {
    return (
      <>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
        )}
        <aside
          className={cn(
            'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#fbfbfa] dark:bg-[#202020] border-r border-border/40 transition-transform duration-200',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarHeader onClose={() => setSidebarOpen(false)} />
          <NavContent />
          <SidebarFooter />
        </aside>
      </>
    );
  }

  // 데스크톱: 고정
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border/40 bg-[#fbfbfa] dark:bg-[#202020] transition-all duration-200 md:flex',
        sidebarOpen ? 'w-60' : 'w-[52px]'
      )}
    >
      <SidebarHeader collapsed={!sidebarOpen} onToggle={toggleSidebar} />
      {sidebarOpen ? <NavContent /> : <NavCollapsed />}
      <SidebarFooter collapsed={!sidebarOpen} />
    </aside>
  );
}

function SidebarHeader({ collapsed, onClose, onToggle }: { collapsed?: boolean; onClose?: () => void; onToggle?: () => void }) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">📚</span>
        {!collapsed && <span className="text-sm font-semibold text-foreground truncate">MyLog</span>}
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5">
          <IoCloseOutline className="h-4 w-4 text-muted" />
        </button>
      )}
      {onToggle && (
        <button onClick={onToggle} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5">
          {collapsed ? <IoChevronForwardOutline className="h-3.5 w-3.5 text-muted" /> : <IoChevronBackOutline className="h-3.5 w-3.5 text-muted" />}
        </button>
      )}
    </div>
  );
}

function NavContent() {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-1">
      {navSections.map((section) => (
        <div key={section.label} className="mb-3">
          <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted/60">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-[6px] text-[13px] transition-colors',
                      isActive
                        ? 'bg-black/5 dark:bg-white/5 text-foreground font-medium'
                        : 'text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 opacity-70" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function NavCollapsed() {
  return (
    <nav className="flex-1 overflow-y-auto px-1.5 py-2">
      <div className="space-y-1">
        {navSections.flatMap((s) => s.items).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center rounded-md p-2 transition-colors',
                  isActive
                    ? 'bg-black/5 dark:bg-white/5 text-foreground'
                    : 'text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground'
                )
              }
              title={item.label}
            >
              <Icon className="h-[18px] w-[18px] opacity-70" />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed?: boolean }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="shrink-0 border-t border-border/40 p-2">
      {/* 사용자 프로필 */}
      {user && (
        <div className={cn('mb-1.5 flex items-center rounded-md px-2 py-1.5', collapsed ? 'justify-center' : 'gap-2')}>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {user.nickname[0]}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-foreground">{user.nickname}</p>
              <p className="truncate text-[11px] text-muted/60">{user.email}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-md px-2 py-[6px] text-[13px] transition-colors',
              collapsed ? 'justify-center' : 'gap-2.5',
              isActive
                ? 'bg-black/5 dark:bg-white/5 text-foreground'
                : 'text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground'
            )
          }
          title="설정"
        >
          <IoSettingsOutline className="h-[18px] w-[18px] shrink-0 opacity-70" />
          {!collapsed && <span>설정</span>}
        </NavLink>

        <button
          onClick={async () => { await logout(); window.location.href = '/login'; }}
          className={cn(
            'flex w-full items-center rounded-md px-2 py-[6px] text-[13px] text-muted transition-colors hover:bg-red-500/5 hover:text-red-500',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
          title="로그아웃"
        >
          <IoLogOutOutline className="h-[18px] w-[18px] shrink-0 opacity-70" />
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </div>
  );
}
