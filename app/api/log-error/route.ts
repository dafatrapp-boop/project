import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Self-hosted error monitoring sink (migration 0038, architecture
 * review 7.3). Accepts a best-effort error report from either error
 * boundary (app/(dashboard)/error.tsx, app/global-error.tsx) and any
 * client component that wants to report a caught error. Writes via
 * the service-role client because this must work even when there's no
 * session at all (the root global-error boundary can fire before auth
 * resolves) — the same reasoning `lead_activities` uses for
 * trigger-only writes instead of a client insert policy.
 */
export async function POST(request: NextRequest) {
  let body: { message?: string; stack?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = String(body.message ?? '').slice(0, 2000);
  if (!message) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Best-effort session lookup — an error report is still useful
  // without one (e.g. a crash before login), so this never blocks the
  // write on having a session.
  let workspaceId: string | null = null;
  let userId: string | null = null;
  try {
    const sessionClient = createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: membership } = await sessionClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      workspaceId = membership?.workspace_id ?? null;
    }
  } catch {
    // Ignore — errors here shouldn't prevent the error report itself.
  }

  const admin = createAdminClient();
  const { error } = await admin.from('error_log').insert({
    workspace_id: workspaceId,
    user_id: userId,
    message,
    stack: body.stack ? String(body.stack).slice(0, 8000) : null,
    url: body.url ? String(body.url).slice(0, 500) : null,
  });

  if (error) {
    console.error('[log-error] insert failed:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
