'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './button';
import type { ComponentProps } from 'react';

/**
 * Phase 4.4 — server-action forms (login, signup, reset-password, and
 * others across the app) previously had no pending indicator at all:
 * click submit, nothing visibly happens until the redirect completes.
 * useFormStatus reads the nearest parent <form>'s pending state without
 * needing to convert the form to client-side submission — the server
 * action itself is completely untouched, this only reads its status.
 */
export function SubmitButton({ children, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={pending} {...props}>
      {children}
    </Button>
  );
}
