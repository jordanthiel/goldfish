import React from 'react';
import { cn } from '@/lib/utils';
import { BRAND_LOGO_PATH, BRAND_NAME } from '@/constants/brand';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg';

const imgSize: Record<LogoSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const frameSize: Record<LogoSize, string> = {
  xs: 'h-6 w-6 min-h-6 min-w-6',
  sm: 'h-8 w-8 min-h-8 min-w-8',
  md: 'h-10 w-10 min-h-10 min-w-10',
  lg: 'h-12 w-12 min-h-12 min-w-12',
};

/** Square app icon with light frame — headers, nav. */
export function BrandAppIcon({
  size = 'md',
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center',
        frameSize[size],
        className,
      )}
    >
      <img
        src={BRAND_LOGO_PATH}
        alt={BRAND_NAME}
        decoding="async"
        className={cn('object-contain', imgSize[size])}
      />
    </div>
  );
}

/** Circular avatar for assistant / chatbot message rows. */
export function BrandChatAvatar({
  className,
  bubble = 'light',
}: {
  /** Outer wrapper, e.g. h-8 w-8 */
  className?: string;
  /** `light` = white ring; `gradient` = purple-pink ring like legacy bot bubbles */
  bubble?: 'light' | 'gradient';
}) {
  const ring =
    bubble === 'gradient'
      ? 'bg-gradient-to-br from-therapy-purple to-therapy-pink p-px'
      : 'ring-1 ring-gray-200/90 bg-white';

  return (
    <div
      className={cn(
        'flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden',
        ring,
        className,
      )}
    >
      <div className="rounded-full bg-white w-full h-full flex items-center justify-center p-0.5">
        <img
          src={BRAND_LOGO_PATH}
          alt=""
          role="presentation"
          decoding="async"
          className="w-[72%] h-[72%] object-contain"
        />
      </div>
    </div>
  );
}
