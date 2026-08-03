import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Body: { endpoint, keys: { p256dh, auth } }
 * Standard shape of PushSubscription.toJSON().
 *
 * Auth: uses the normal cookie-bound server client (not the admin
 * client) — RLS's `user_id = auth.uid()` check on push_subscriptions
 * is the real authorization boundary here, same as every other
 * user-owned table in this project.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  let payload: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const endpoint = payload.endpoint;
  const p256dh = payload.keys?.p256dh;
  const authKey = payload.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth_key: authKey,
      user_agent: request.headers.get('user-agent') ?? null,
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  // Push being enabled on a device implies the user wants push in
  // general — flip the master switch back on so a previously-disabled
  // preference doesn't silently swallow a fresh opt-in.
  await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, push_enabled: true }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
