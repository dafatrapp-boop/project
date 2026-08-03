'use client';

import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineRetryButton() {
  return (
    <Button variant="primary" size="md" onClick={() => window.location.reload()}>
      <RotateCw size={16} strokeWidth={2} />
      إعادة المحاولة
    </Button>
  );
}
