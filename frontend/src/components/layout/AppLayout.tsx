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
          'transition-all duration-300',
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-60' : 'ml-16'
        )}
      >
        <Header />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
