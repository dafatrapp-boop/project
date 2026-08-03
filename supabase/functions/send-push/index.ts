// Supabase Edge Function — deploy with:
//   supabase functions deploy send-push --no-verify-jwt
//
// Called only by the `queue_push_notification()` DB trigger
// (supabase/migrations/0023_push_notifications.sql) via pg_net, never
// directly by the client. Authenticated with a shared-secret bearer
// token (PUSH_TRIGGER_SECRET) rather than a user JWT — the trigger
// runs as Postgres, not as any particular end user — hence
// `--no-verify-jwt` above and the manual check below instead.
//
// Required secrets (`supabase secrets set ...`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: or https: URL)
//   PUSH_TRIGGER_SECRET   (must match app_config.push_function_secret)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are already provided
//   automatically to every Edge Function.

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.7';

interface QueuedNotification {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
}

// Reuses existing brand assets — no new image generation needed. The
// shortcut icons already exist for the manifest's app-shortcuts
// feature (public/icons/shortcut-*.png); giving lead- and campaign-
// related pushes their own icon (instead of every notification type
// looking identical, the audit's finding) costs nothing extra to ship.
function iconForType(type: string): string {
  if (type === 'new_lead' || type === 'reminder_lead_followup' || type === 'reminder_call' || type === 'reminder_callback') {
    return '/icons/shortcut-leads.png';
  }
  if (type === 'new_campaign' || type === 'reminder_campaign') {
    return '/icons/shortcut-campaigns.png';
  }
  return '/icons/icon-192.png';
}

Deno.serve(async (req: Request) => {
  const expectedSecret = Deno.env.get('PUSH_TRIGGER_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return new Response('vapid_not_configured', { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  let payload: QueuedNotification;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid_body', { status: 400 });
  }
  if (!payload.user_id || !payload.title) {
    return new Response('missing_fields', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', payload.user_id);

  if (error || !subscriptions || subscriptions.length === 0) {
    return new Response('no_subscriptions', { status: 200 });
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body ?? '',
    url: payload.link ?? '/dashboard',
    type: payload.type,
    // Unique per notification (not per type) — a previous version used
    // `payload.type` here, which meant two DIFFERENT notifications of
    // the same type (e.g. two new leads arriving minutes apart)
    // silently replaced each other instead of both showing, since same-
    // tag notifications collapse by design in the Notifications API.
    // Using the notification's own id means only genuine re-deliveries
    // of the SAME notification would ever collapse.
    tag: payload.notification_id,
    icon: iconForType(payload.type),
    notificationId: payload.notification_id,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          notificationPayload
        );
        return { subscriptionId: sub.id, success: true as const };
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404/410 = the subscription is gone (user revoked permission,
        // cleared site data, uninstalled, etc.) — clean it up so future
        // sends don't keep failing against a dead endpoint.
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        throw { subscriptionId: sub.id, statusCode, message: (err as Error)?.message ?? String(err) };
      }
    })
  );

  // Delivery logging — previously nothing recorded whether a send
  // actually succeeded per-device; this is the one piece of
  // observability the audit flagged as completely absent. Best-effort:
  // a logging failure must never affect the response below.
  try {
    const logRows = results.map((r) => {
      if (r.status === 'fulfilled') {
        return {
          notification_id: payload.notification_id,
          subscription_id: r.value.subscriptionId,
          success: true,
          status_code: 201,
          error: null,
        };
      }
      const reason = r.reason as { subscriptionId?: string; statusCode?: number; message?: string };
      return {
        notification_id: payload.notification_id,
        subscription_id: reason?.subscriptionId ?? null,
        success: false,
        status_code: reason?.statusCode ?? null,
        error: reason?.message ?? 'unknown_error',
      };
    });
    await supabase.from('push_delivery_log').insert(logRows);
  } catch {
    // Never let logging failure mask the actual send result.
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
