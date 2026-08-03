import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Backs the "تعليم كمقروء" (mark as read) push-notification action
 * button (see public/sw.js's notificationclick handler) — a plain JSON
 * API route rather than a Server Action because the service worker
 * calls this with a normal `fetch()`, not a Next.js form submission.
 * Same-origin fetches from a service worker send cookies by default,
 * so the normal session-scoped Supabase client (RLS: users can only
 * update their own notifications) is enough here — no service role
 * needed, and no user other than the notification's own recipient
 * could ever mark it read even if they guessed the id.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
