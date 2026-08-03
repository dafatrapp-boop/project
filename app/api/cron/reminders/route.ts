import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Secondary trigger for the reminder scheduler — the primary one is
 * pg_cron running `process_due_reminders()` directly inside Postgres
 * every minute (see migration 0024), which sidesteps Vercel's Hobby-
 * plan restriction of once-per-day cron jobs entirely. This route
 * exists for:
 *  1. Environments where pg_cron isn't available (self-hosted
 *     Postgres, or a Supabase project where it hasn't been enabled).
 *  2. A manually-triggerable path for testing ("did my reminder fire").
 *  3. Vercel Cron itself, configured in vercel.json, as a redundant
 *     safety net — calling process_due_reminders() twice in quick
 *     succession is harmless (it only ever claims 'pending' rows, so a
 *     second concurrent call simply finds nothing left to do).
 *
 * Auth: Vercel automatically sends `Authorization: Bearer
 * $CRON_SECRET` on requests it triggers from vercel.json's `crons`
 * config. The same secret gates manual/monitoring calls — this is a
 * privileged, cross-workspace operation (it uses the service-role
 * client), never something a logged-in user's session should reach,
 * which is also why /api/cron is excluded from the session-refresh
 * middleware entirely (see middleware.ts).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 501 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('process_due_reminders', { p_batch_size: 100 });

  if (error) {
    console.error('[cron/reminders] process_due_reminders failed:', error);
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }

  const rows = data ?? [];
  const summary = {
    processed: rows.length,
    sent: rows.filter((r) => r.outcome === 'sent').length,
    retryScheduled: rows.filter((r) => r.outcome === 'retry_scheduled').length,
    failed: rows.filter((r) => r.outcome === 'failed').length,
  };

  return NextResponse.json(summary);
}
