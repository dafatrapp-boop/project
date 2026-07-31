import type { Database } from '@/types/database';

export type AutomationRuleType = Database['public']['Tables']['automation_rules']['Row']['rule_type'];

export const AUTOMATION_RULE_LABELS: Record<AutomationRuleType, string> = {
  lead_stale_reminder: 'تذكير عند عدم الرد على عميل جديد',
  interested_followup: 'متابعة تلقائية بعد اهتمام العميل',
  campaign_tag: 'وسم تلقائي حسب الحملة',
  inactivity_flag: 'تنبيه عند توقف النشاط عن عميل',
};

export const AUTOMATION_RULE_DESCRIPTIONS: Record<AutomationRuleType, string> = {
  lead_stale_reminder: 'إذا بقي عميل جديد بحالة "جديد" أكثر من عدد الساعات المحدد، ننشئ تذكيرًا للمتابعة معه.',
  interested_followup: 'إذا أصبح العميل بحالة "مهتم"، ننشئ متابعة تلقائية بعد عدد الأيام المحدد.',
  campaign_tag: 'إذا جاء عميل من حملة معينة، نضيف له وسمًا تلقائيًا لتمييزه.',
  inactivity_flag: 'إذا لم يحصل أي نشاط على عميل (غير مكتمل الصفقة) لعدد الأيام المحدد، نضيف له وسمًا يشير إلى أنه يحتاج متابعة.',
};

/** Whether this rule type may have more than one row per workspace
 * (campaign_tag can — one per campaign). The others are singletons. */
export const AUTOMATION_RULE_REPEATABLE: Record<AutomationRuleType, boolean> = {
  lead_stale_reminder: false,
  interested_followup: false,
  campaign_tag: true,
  inactivity_flag: false,
};

export const AUTOMATION_RULE_ORDER: AutomationRuleType[] = [
  'lead_stale_reminder',
  'interested_followup',
  'campaign_tag',
  'inactivity_flag',
];

export function defaultConfigFor(ruleType: AutomationRuleType): Record<string, unknown> {
  switch (ruleType) {
    case 'lead_stale_reminder':
      return { hours: 24 };
    case 'interested_followup':
      return { days: 3 };
    case 'campaign_tag':
      return { campaign_id: '', tag: '' };
    case 'inactivity_flag':
      return { days: 14, tag: 'يحتاج متابعة' };
  }
}
