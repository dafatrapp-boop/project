export type MemberRole = 'owner' | 'admin' | 'agent';

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'مالك',
  admin: 'مشرف',
  agent: 'موظف مبيعات',
};
