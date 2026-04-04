import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

/** 768px 기준으로 모바일 감지, uiStore와 동기화 */
export function useResponsiveSidebar() {
  const setMobile = useUIStore((s) => s.setMobile);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setMobile(e.matches);
    };

    // 초기 실행
    handler(mq);

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setMobile]);
}
