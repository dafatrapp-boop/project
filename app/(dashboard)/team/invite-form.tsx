import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from './constants';
import { inviteMemberAction } from './actions';

export function InviteForm() {
  return (
    <form action={inviteMemberAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input name="email" type="email" label="البريد الإلكتروني" placeholder="colleague@example.com" required />
      </div>
      <div className="sm:w-40">
        <Select name="role" label="الدور" defaultValue="agent">
          {Object.entries(ROLE_LABELS)
            .filter(([value]) => value !== 'owner')
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </Select>
      </div>
      <Button type="submit">إرسال دعوة</Button>
    </form>
  );
}
