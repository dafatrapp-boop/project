import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Body: { endpoint } */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  let payload: { endpoint?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!payload.endpoint) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // RLS (`user_id = auth.uid()`) already scopes this to the caller's
  // own rows — the explicit .eq('user_id', ...) is defense in depth,
  // not the actual boundary.
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', payload.endpoint);

  return NextResponse.json({ ok: true });
}
