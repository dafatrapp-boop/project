import { requireWorkspace } from '@/lib/workspace';
import { getOnboardingChecklist, checklistProgress } from '@/lib/onboarding/checklist';
import { OnboardingBanner } from './onboarding-banner';

/**
 * Isolated in its own Suspense boundary (see (dashboard)/layout.tsx)
 * because the checklist itself is a 7-query batch — the most expensive
 * single thing the shell fetches. It should never hold up the sidebar,
 * header, or the page's own content; a banner that pops in a beat later
 * reads as normal, a frozen dashboard does not.
 */
export async function OnboardingBannerServer() {
  const { supabase, workspaceId, onboardingDismissedAt } = await requireWorkspace();
  if (onboardingDismissedAt) return null;

  const steps = await getOnboardingChecklist(supabase, workspaceId);
  const progress = checklistProgress(steps);
  if (progress >= 100) return null;

  return <OnboardingBanner progress={progress} />;
}
