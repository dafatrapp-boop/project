import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Secondary trigger for the reminder scheduler — the primary one is
 * pg_cron running `process_due_reminders()` directly inside Postgres
 * every minute (see migration 0024). That split is deliberate: Vercel's
 * Hobby plan hard-rejects the entire deployment if `vercel.json`
 * declares a cron schedule more frequent than once per day (this
 * isn't a soft limit — the build fails outright), so `vercel.json`
 * here is set to `0 0 * * *` (once daily) to stay deployable on Hobby.
 * Real minute-level responsiveness comes entirely from pg_cron, which
 * runs inside Postgres and is completely unaffected by Vercel's plan.
 *
 * This route exists for:
 *  1. Environments where pg_cron isn't available (self-hosted
 *     Postgres, or a Supabase project where it hasn't been enabled) —
 *     there, the once-daily Vercel Cron is the only automatic trigger,
 *     so reminders would only be checked once a day; on Vercel Pro or
 *     above, tighten vercel.json's schedule to every 5 minutes to
 *     close that gap (a literal cron expression isn't spelled out here
 *     since a "star-slash" sequence would prematurely close this very
 *     comment block).
 *  2. A manually-triggerable path for testing ("did my reminder fire").
 *  3. A once-daily safety net even when pg_cron IS working — calling
 *     process_due_reminders() twice in quick succession is harmless
 *     (it only ever claims 'pending' rows), so there's no downside to
 *     both running.
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
  const [{ data, error }, { data: followUpData, error: followUpError }] = await Promise.all([
    supabase.rpc('process_due_reminders', { p_batch_size: 100 }),
    supabase.rpc('process_due_follow_ups', { p_batch_size: 100 }),
  ]);

  if (error) {
    console.error('[cron/reminders] process_due_reminders failed:', error);
  }
  if (followUpError) {
    console.error('[cron/reminders] process_due_follow_ups failed:', followUpError);
  }
  if (error && followUpError) {
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }

  const rows = data ?? [];
  const followUpRows = followUpData ?? [];
  const summary = {
    reminders: {
      processed: rows.length,
      sent: rows.filter((r) => r.outcome === 'sent').length,
      retryScheduled: rows.filter((r) => r.outcome === 'retry_scheduled').length,
      failed: rows.filter((r) => r.outcome === 'failed').length,
    },
    followUps: {
      processed: followUpRows.length,
      notified: followUpRows.filter((r) => r.outcome === 'notified').length,
      failed: followUpRows.filter((r) => r.outcome === 'failed').length,
    },
  };

  return NextResponse.json(summary);
}
