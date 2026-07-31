import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 text-center">
      <div>
        <p className="text-sm font-medium text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-ink-muted">
          الرابط الذي فتحته غير صحيح أو تم حذف الصفحة.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-brand-500 px-6 text-sm font-medium text-white hover:bg-brand-600"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
