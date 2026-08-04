'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/error-log/report';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportClientError(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="text-xl font-semibold">حدث خطأ في التطبيق</h1>
          <p className="max-w-sm text-sm text-gray-500">
            نعتذر عن الإزعاج. حاول إعادة تحميل الصفحة.
          </p>
          <button
            onClick={reset}
            className="mt-2 h-11 rounded-md bg-indigo-600 px-6 text-sm font-medium text-white"
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
