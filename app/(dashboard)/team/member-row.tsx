'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateMemberRoleAction, removeMemberAction } from './actions';
import { ROLE_LABELS, type MemberRole } from './constants';

export function MemberRow({
  userId,
  name,
  role,
  isSelf,
}: {
  userId: string;
  name: string;
  role: MemberRole;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle p-3">
      <div>
        <p className="text-sm font-medium text-ink">
          {name} {isSelf && <span className="text-ink-faint">(أنت)</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-36">
          <Select
            value={role}
            disabled={pending || role === 'owner'}
            onChange={(e) => {
              const next = e.target.value as MemberRole;
              startTransition(async () => {
                await updateMemberRoleAction(userId, next);
                show('تم تحديث الدور', 'success');
              });
            }}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value} disabled={value === 'owner'}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {role !== 'owner' && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await removeMemberAction(userId);
                show('تمت إزالة العضو', 'success');
              })
            }
            className="rounded p-2 text-danger hover:bg-danger/10"
            aria-label="إزالة العضو"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
