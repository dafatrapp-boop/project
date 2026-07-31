'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Drop-in submit button for <form action={serverAction}>. useFormStatus
 * reads the pending state of the nearest parent <form>, so this works
 * even though the action itself runs on the server — the user always
 * gets a spinner + disabled state instead of a button that looks dead
 * for the ~300-800ms round trip.
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  size = 'lg',
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size={size}
      disabled={pending}
      aria-busy={pending}
      className={cn('relative w-full', className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
