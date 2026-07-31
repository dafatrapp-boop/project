'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importLeadsCsvAction, type ImportResult } from './actions';

const SAMPLE_CSV = 'name,phone,email,source\nأحمد محمد,+966501234567,ahmed@example.com,instagram\n';

export default function ImportLeadsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);
    const res = await importLeadsCsvAction(formData);
    setResult(res);
    setLoading(false);
    if (res.ok) formRef.current?.reset();
  }

  function downloadSample() {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/leads" className="flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronRight size={16} className="icon-flip" />
        العودة إلى العملاء المحتملين
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-ink">استيراد عملاء من CSV</h1>
        <p className="mt-1 text-sm text-ink-muted">
          الأعمدة المدعومة: الاسم (مطلوب)، الهاتف، البريد الإلكتروني، المصدر.
        </p>
      </div>

      <button onClick={downloadSample} className="self-start text-sm font-medium text-brand-600 hover:underline">
        تنزيل نموذج CSV
      </button>

      {result && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            result.ok
              ? 'border-success/30 bg-success/5 text-success'
              : 'border-danger/30 bg-danger/5 text-danger'
          }`}
        >
          {result.ok
            ? `تم استيراد ${result.imported} عميلًا بنجاح.${result.skipped ? ` تم تخطي ${result.skipped} صف غير صالح.` : ''}`
            : result.error}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="rounded-md border border-dashed border-border bg-surface-subtle p-4 text-sm text-ink-muted"
        />
        <Button type="submit" disabled={loading}>
          <Upload size={16} />
          {loading ? 'جارٍ الاستيراد...' : 'استيراد'}
        </Button>
      </form>

      <p className="text-xs text-ink-faint">
        حد أقصى 500 صف لكل ملف و2 ميجابايت لكل استيراد. لا يوجد فحص تكرار أثناء الاستيراد الجماعي —
        استخدم صفحة إضافة عميل يدويًا للاستفادة من كشف التكرار.
      </p>
    </div>
  );
}
