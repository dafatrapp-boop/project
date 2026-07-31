'use server';

import { createClient } from '@/lib/supabase/server';

/** "Don't show again" for a single page's guide. */
export async function dismissGuideAction(guideKey: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('user_guide_state')
    .upsert({ user_id: user.id, guide_key: guideKey }, { onConflict: 'user_id,guide_key' });
}
