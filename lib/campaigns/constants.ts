import type { Database } from '@/types/database';

export type CampaignPlatform = Database['public']['Tables']['campaigns']['Row']['platform'];
export type CampaignStatus = Database['public']['Tables']['campaigns']['Row']['status'];

export const PLATFORM_LABELS: Record<CampaignPlatform, string> = {
  facebook: 'فيسبوك',
  instagram: 'انستغرام',
  tiktok: 'تيك توك',
  snapchat: 'سناب شات',
  google: 'جوجل',
  whatsapp: 'واتساب',
  other: 'أخرى',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'مسودة',
  active: 'نشطة',
  paused: 'متوقفة مؤقتًا',
  ended: 'منتهية',
};

export const CAMPAIGN_STATUS_TONE: Record<
  CampaignStatus,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  ended: 'danger',
};
