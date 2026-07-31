'use client';

import { useTransition } from 'react';
import { X } from 'lucide-react';
import { cancelInvitationAction } from './actions';

export function CancelInvitationButton({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => cancelInvitationAction(invitationId))}
      className="rounded p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger"
      aria-label="إلغاء الدعوة"
    >
      <X size={14} />
    </button>
  );
}
