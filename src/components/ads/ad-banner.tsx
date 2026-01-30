'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * Google AdSense Banner Component
 *
 * To use:
 * 1. Sign up at https://www.google.com/adsense
 * 2. Add your publisher ID to .env as NEXT_PUBLIC_ADSENSE_ID
 * 3. Create ad units and use their slot IDs
 *
 * Example:
 * <AdBanner slot="1234567890" format="horizontal" />
 */
export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only load ad once
    if (isAdLoaded.current) return;

    const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;
    if (!publisherId || !slot) return;

    try {
      // Push ad to adsbygoogle array
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isAdLoaded.current = true;
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [slot]);

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  // Don't render if no publisher ID configured
  if (!publisherId) {
    return null;
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Wrapper that only shows ads to non-Pro users
 */
interface AdForFreeUsersProps extends AdBannerProps {
  isPro: boolean;
}

export function AdForFreeUsers({ isPro, ...props }: AdForFreeUsersProps) {
  // Pro users don't see ads
  if (isPro) {
    return null;
  }

  return <AdBanner {...props} />;
}
