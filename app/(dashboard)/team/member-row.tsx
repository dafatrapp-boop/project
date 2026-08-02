'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { IconButton } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { updateMemberRoleAction, removeMemberAction } from './actions';
import { ROLE_LABELS, type MemberRole } from './constants';

const ROLE_TONE_CLASS: Record<MemberRole, string> = {
  owner: 'border-brand-200 bg-brand-50 text-brand-700',
  admin: 'border-warning/25 bg-warning-50 text-warning',
  agent: '',
};

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
      <div className="flex items-center gap-2.5">
        <Avatar name={name} size="sm" />
        <p className="text-body-sm font-medium text-ink">
          {name} {isSelf && <span className="text-ink-faint">(أنت)</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-36">
          <Select
            value={role}
            disabled={pending || role === 'owner'}
            className={ROLE_TONE_CLASS[role]}
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
          <IconButton
            variant="ghost"
            size="sm"
            disabled={pending}
            aria-label={`إزالة ${name}`}
            className="hover:bg-danger-50 hover:text-danger"
            onClick={() => {
              if (!window.confirm(`هل تريد إزالة "${name}" من الفريق؟`)) return;
              startTransition(async () => {
                await removeMemberAction(userId);
                show('تمت إزالة العضو', 'success');
              });
            }}
          >
            <Trash2 size={14} />
          </IconButton>
        )}
      </div>
    </div>
  );
}
