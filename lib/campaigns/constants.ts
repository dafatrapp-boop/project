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

/**
 * Default `utm_medium` per platform for the tracking-link generator on
 * the campaign detail page. Previously the page only displayed
 * `utm_campaign` as plain text and left the merchant to hand-build the
 * full URL (source/medium/campaign) themselves in the ad platform —
 * a step that's easy to get wrong or skip, breaking attribution.
 */
export const UTM_MEDIUM_BY_PLATFORM: Record<CampaignPlatform, string> = {
  facebook: 'paid_social',
  instagram: 'paid_social',
  tiktok: 'paid_social',
  snapchat: 'paid_social',
  google: 'cpc',
  whatsapp: 'referral',
  other: 'paid',
};
