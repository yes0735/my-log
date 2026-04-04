import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { IoMenuOutline, IoSearchOutline, IoPersonCircleOutline } from 'react-icons/io5';

export default function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const { user, isAuthenticated } = useAuthStore();

  const handleMenuClick = () => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={handleMenuClick}
          className="rounded-md p-2 hover:bg-secondary"
          aria-label="Toggle sidebar"
        >
          <IoMenuOutline className="h-5 w-5" />
        </button>
        {isMobile && (
          <span className="text-lg font-bold text-primary">📚 MyLog</span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="rounded-md p-2 hover:bg-secondary" aria-label="Search">
          <IoSearchOutline className="h-5 w-5" />
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline">{user?.nickname}</span>
            <IoPersonCircleOutline className="h-7 w-7 text-muted" />
          </div>
        ) : (
          <a
            href="/login"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            로그인
          </a>
        )}
      </div>
    </header>
  );
}
