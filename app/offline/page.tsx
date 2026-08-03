import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { OfflineRetryButton } from './retry-button';

// Deliberately outside the (dashboard) route group: no auth check, no
// Supabase call, no `force-dynamic`. This page must render correctly
// with zero network access, straight from the service worker's
// precache (see public/sw.js) — anything dynamic here would defeat
// the purpose.
export const metadata: Metadata = {
  title: 'غير متصل — SocialSales OS',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <WifiOff size={26} strokeWidth={2} />
      </span>
      <div className="max-w-sm">
        <h1 className="text-title-lg text-ink">لا يوجد اتصال بالإنترنت</h1>
        <p className="mt-2 text-body-sm text-ink-muted">
          تعذّر الوصول إلى هذه الصفحة لأنك غير متصل حاليًا. تحقق من اتصالك وحاول مرة أخرى — أي
          صفحات فتحتها سابقًا ستعمل تلقائيًا فور عودة الاتصال.
        </p>
      </div>
      <OfflineRetryButton />
    </div>
  );
}
