import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface ChecklistStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

/**
 * Every step here is derived live from real rows that already exist in
 * the schema (landing pages, leads, team members, settings) — nothing
 * is stored just to represent "the user did step N". This is what the
 * spec calls for explicitly ("Checklist حقيقية تعتمد على إمكانيات
 * المشروع الموجودة"): the checklist can never drift out of sync with
 * what the merchant actually did, because it just re-reads it.
 */
export async function getOnboardingChecklist(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<ChecklistStep[]> {
  const [
    { count: landingPagesCount },
    { count: publishedCount },
    { count: leadsCount },
    { count: teamCount },
    { data: appointmentSettings },
    { data: workspace },
    { count: ordersCount },
  ] = await Promise.all([
    supabase.from('landing_pages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase
      .from('landing_pages')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'published'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('workspace_members').select('user_id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('appointment_settings').select('enabled').eq('workspace_id', workspaceId).maybeSingle(),
    supabase.from('workspaces').select('meta_pixel_id, industry').eq('id', workspaceId).single(),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
  ]);

  const hasBusinessSetup = !!workspace; // true the moment the workspace row exists (created at signup)
  const hasLandingPage = (landingPagesCount ?? 0) > 0;
  const hasPublishedPage = (publishedCount ?? 0) > 0;
  const hasLead = (leadsCount ?? 0) > 0;
  const hasRelevantSetup =
    !!appointmentSettings?.enabled || !!workspace?.meta_pixel_id || (ordersCount ?? 0) > 0;
  const hasTeamMember = (teamCount ?? 0) > 1;

  return [
    { id: 'business_setup', label: 'اختيار نوع النشاط وبيانات مساحة العمل', done: hasBusinessSetup, href: '/settings' },
    { id: 'landing_page', label: 'إنشاء أول صفحة هبوط', done: hasLandingPage, href: '/landing-pages/new' },
    { id: 'publish_page', label: 'نشر الصفحة لتصبح متاحة للزوار', done: hasPublishedPage, href: '/landing-pages' },
    { id: 'first_lead', label: 'إضافة أول عميل محتمل', done: hasLead, href: '/leads' },
    { id: 'relevant_setup', label: 'إعداد المواعيد أو Meta Pixel أو أول طلب', done: hasRelevantSetup, href: '/settings' },
    { id: 'invite_team', label: 'دعوة عضو من فريقك (اختياري)', done: hasTeamMember, href: '/team' },
  ];
}

export function checklistProgress(steps: ChecklistStep[]): number {
  if (steps.length === 0) return 100;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}
