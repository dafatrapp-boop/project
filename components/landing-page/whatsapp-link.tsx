'use client';

import type { ReactNode } from 'react';
import { trackPixelEvent } from '@/lib/meta-pixel/client';

export function WhatsAppLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={() => trackPixelEvent('Contact')}>
      {children}
    </a>
  );
}
