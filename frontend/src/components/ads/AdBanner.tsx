// Design Ref: §9.7 — Google AdSense banner component
// Plan SC: AdSense 스크립트 로드 + 광고 슬롯 렌더링
import { useEffect, useRef } from 'react';

interface AdBannerProps {
  adClient: string;
  adSlot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export default function AdBanner({ adClient, adSlot, format = 'auto', className }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded — silently ignore
    }
  }, []);

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
