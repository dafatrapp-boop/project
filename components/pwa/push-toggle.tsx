'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { getVapidPublicKey, urlBase64ToUint8Array } from '@/lib/push/vapid';

type Status = 'checking' | 'unsupported' | 'denied' | 'off' | 'on';

/**
 * Lives on the Settings page (see app/(dashboard)/settings/page.tsx),
 * inside its own Card — a notification-preference toggle is account
 * configuration, same tier as the Meta Pixel / appointment settings
 * already on that page, not something that belongs in the header.
 *
 * Talks directly to Supabase with the browser (RLS-scoped) client for
 * notification_preferences — no new server action needed, since a
 * user managing their own preference row is exactly what
 * "notification_preferences_update_own" (migration 0023) exists for.
 * Subscribing/unsubscribing the actual device goes through
 * /api/push/* instead, since that also needs the service worker
 * registration, which only exists client-side.
 */
export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('checking');
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !getVapidPublicKey()) {
        if (!cancelled) setStatus('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setStatus('denied');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? 'on' : 'off');
      } catch {
        if (!cancelled) setStatus('off');
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  function enable() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setStatus(permission === 'denied' ? 'denied' : 'off');
          return;
        }

        const vapidKey = getVapidPublicKey();
        if (!vapidKey) {
          setStatus('unsupported');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const json = subscription.toJSON();
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
        if (!res.ok) throw new Error('subscribe_failed');

        setStatus('on');
        show('تم تفعيل الإشعارات الفورية على هذا الجهاز.', 'success');
      } catch {
        show('تعذّر تفعيل الإشعارات الفورية. حاول مرة أخرى.', 'error');
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          });
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('notification_preferences')
            .upsert({ user_id: user.id, push_enabled: false }, { onConflict: 'user_id' });
        }

        setStatus('off');
        show('تم إيقاف الإشعارات الفورية.', 'info');
      } catch {
        show('تعذّر إيقاف الإشعارات الفورية. حاول مرة أخرى.', 'error');
      }
    });
  }

  if (status === 'checking') return null;

  if (status === 'unsupported') {
    return (
      <p className="flex items-center gap-2 text-body-sm text-ink-faint">
        <BellOff size={16} />
        الإشعارات الفورية غير مدعومة على هذا المتصفح أو الجهاز.
      </p>
    );
  }

  if (status === 'denied') {
    return (
      <p className="flex items-center gap-2 text-body-sm text-ink-faint">
        <BellOff size={16} />
        تم حظر إذن الإشعارات من إعدادات المتصفح. لتفعيلها، امنح الإذن من إعدادات الموقع في متصفحك.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <Bell size={16} className="text-ink-muted" />
        <span className="text-body-sm text-ink">
          استلام إشعارات فورية لعملاء جدد، تذكيرات المواعيد، وتنبيهات الحملات
        </span>
      </div>
      <Switch checked={status === 'on'} disabled={pending} onChange={(next) => (next ? enable() : disable())} />
    </div>
  );
}
