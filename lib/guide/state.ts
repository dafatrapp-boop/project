import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Whether this user has permanently dismissed ("Don't show again") the
 * small in-app guide for a given page. Read once per page load — the
 * guide itself only needs a boolean, never the full row.
 */
export async function getGuideDismissed(
  supabase: SupabaseClient<Database>,
  userId: string,
  guideKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_guide_state')
    .select('guide_key')
    .eq('user_id', userId)
    .eq('guide_key', guideKey)
    .maybeSingle();

  return !!data;
}
