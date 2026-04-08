import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '@/stores/uiStore';
import { useResponsiveSidebar } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  useResponsiveSidebar();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isMobile = useUIStore((s) => s.isMobile);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-200',
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-60' : 'ml-[52px]'
        )}
      >
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-5 pb-16 md:px-8 md:py-6 md:pb-20">
          <Outlet />
        </main>
        <footer className="border-t border-border/40 py-6 text-center text-[12px] text-muted">
          <p>© {new Date().getFullYear()} MyLog — 나만의 독서 기록 플랫폼</p>
        </footer>
      </div>
    </div>
  );
}
