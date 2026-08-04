'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, Download, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { importLeadsCsvAction, type ImportResult } from './actions';

const SAMPLE_CSV = 'name,phone,email,source\nأحمد محمد,+966501234567,ahmed@example.com,instagram\n';

export default function ImportLeadsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);
    const res = await importLeadsCsvAction(formData);
    setResult(res);
    setLoading(false);
    if (res.ok) {
      formRef.current?.reset();
      setFileName(null);
    }
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
      <PageHeader
        title="استيراد عملاء من CSV"
        description="الأعمدة المدعومة: الاسم (مطلوب)، الهاتف، البريد الإلكتروني، المصدر، الوسوم. يدعم أيضًا ملفات تصدير Google Contacts مباشرة بدون تعديل. العملاء المكررون (نفس الهاتف/البريد) يُتجاهلون تلقائيًا."
      />

      <Card>
        <button
          onClick={downloadSample}
          className="mb-4 flex items-center gap-1.5 text-body-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          <Download size={14} />
          تنزيل نموذج CSV
        </button>

        {result && (
          <div
            className={`mb-4 flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-body-sm ${
              result.ok ? 'border-success/20 bg-success-50 text-success' : 'border-danger/20 bg-danger-50 text-danger'
            }`}
            role="status"
          >
            {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <span>
              {result.ok
                ? `تم استيراد ${result.imported} عميلًا بنجاح.${result.duplicates ? ` تم تجاهل ${result.duplicates} عميل مكرر (هاتف/بريد موجود مسبقًا).` : ''}${result.skipped ? ` تم تخطي ${result.skipped} صف غير صالح.` : ''}`
                : result.error}
            </span>
          </div>
        )}

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink-faint">
              <FileText size={18} />
            </span>
            <span className="text-body-sm font-medium text-ink">
              {fileName ?? 'اختر ملف CSV أو اسحبه هنا'}
            </span>
            <span className="text-caption text-ink-faint">حد أقصى 500 صف و2 ميجابايت</span>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="sr-only"
            />
          </label>
          <Button type="submit" loading={loading} disabled={loading}>
            <Upload size={16} />
            {loading ? 'جارٍ الاستيراد...' : 'استيراد'}
          </Button>
        </form>
      </Card>

      <p className="text-caption text-ink-faint">
        لا يوجد فحص تكرار أثناء الاستيراد الجماعي — استخدم صفحة إضافة عميل يدويًا للاستفادة من كشف التكرار.
      </p>
    </div>
  );
}
