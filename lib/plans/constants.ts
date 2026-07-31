export type Plan = 'free' | 'starter' | 'growth' | 'pro';

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'تجريبية',
  starter: 'أساسية',
  growth: 'نمو',
  pro: 'احترافية',
};

interface PlanLimits {
  maxLandingPages: number; // -1 = unlimited
  maxTeamMembers: number;
  maxCampaigns: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxLandingPages: 1, maxTeamMembers: 1, maxCampaigns: 1 },
  starter: { maxLandingPages: 5, maxTeamMembers: 3, maxCampaigns: 5 },
  growth: { maxLandingPages: 20, maxTeamMembers: 10, maxCampaigns: -1 },
  pro: { maxLandingPages: -1, maxTeamMembers: -1, maxCampaigns: -1 },
};

export function isUnderLimit(current: number, limit: number) {
  return limit === -1 || current < limit;
}

/**
 * Boolean feature gates — for features that aren't a count-based
 * limit but are either fully on or fully off per tier, matching the
 * plan comparison table the user approved.
 */
interface PlanFeatures {
  /** Free tier only: show a small "Powered by" badge on public pages. */
  showBranding: boolean;
  tags: boolean;
  kanbanPipeline: boolean;
  duplicateDetection: boolean;
  metaPixel: boolean;
  globalSearch: boolean;
  notificationCenter: boolean;
  duplicateLandingPage: boolean;
  csvImport: boolean;
  excelExport: boolean;
  activityLog: boolean;
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    showBranding: true,
    tags: false,
    kanbanPipeline: false,
    duplicateDetection: false,
    metaPixel: false,
    globalSearch: false,
    notificationCenter: false,
    duplicateLandingPage: false,
    csvImport: false,
    excelExport: false,
    activityLog: false,
  },
  starter: {
    showBranding: false,
    tags: true,
    kanbanPipeline: true,
    duplicateDetection: true,
    metaPixel: true,
    globalSearch: true,
    notificationCenter: true,
    duplicateLandingPage: true,
    csvImport: false,
    excelExport: false,
    activityLog: false,
  },
  growth: {
    showBranding: false,
    tags: true,
    kanbanPipeline: true,
    duplicateDetection: true,
    metaPixel: true,
    globalSearch: true,
    notificationCenter: true,
    duplicateLandingPage: true,
    csvImport: true,
    excelExport: true,
    activityLog: true,
  },
  pro: {
    showBranding: false,
    tags: true,
    kanbanPipeline: true,
    duplicateDetection: true,
    metaPixel: true,
    globalSearch: true,
    notificationCenter: true,
    duplicateLandingPage: true,
    csvImport: true,
    excelExport: true,
    activityLog: true,
  },
};

export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  return PLAN_FEATURES[plan][feature];
}
