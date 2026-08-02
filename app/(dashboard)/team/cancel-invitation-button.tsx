'use client';

import { useTransition } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { cancelInvitationAction } from './actions';

export function CancelInvitationButton({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <IconButton
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => cancelInvitationAction(invitationId))}
      className="hover:bg-danger-50 hover:text-danger"
      aria-label="إلغاء الدعوة"
    >
      <X size={14} />
    </IconButton>
  );
}
