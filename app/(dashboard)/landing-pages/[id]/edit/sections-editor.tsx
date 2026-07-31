'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { SectionRenderer } from '@/components/landing-page/section-renderer';
import { ImageUploadField } from '@/components/landing-page/image-upload-field';
import {
  SECTION_TYPE_LABELS,
  createDefaultSection,
  type Section,
} from '@/lib/landing-pages/types';
import { updateSectionsAction } from '../../actions';

const ADDABLE_TYPES: Section['type'][] = [
  'hero',
  'features',
  'cta',
  'form',
  'testimonials',
  'appointment_booking',
  'footer',
];

export function SectionsEditor({
  pageId,
  workspaceId,
  initialSections,
  whatsappNumber,
}: {
  pageId: string;
  workspaceId: string;
  initialSections: Section[];
  whatsappNumber: string | null;
}) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [newType, setNewType] = useState<Section['type']>('hero');
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function update(index: number, patch: Partial<Section>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? ({ ...s, ...patch } as Section) : s))
    );
  }

  function remove(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addSection() {
    setSections((prev) => [...prev, createDefaultSection(newType)]);
  }

  function save() {
    startTransition(async () => {
      await updateSectionsAction(pageId, sections);
      show('تم حفظ التغييرات', 'success');
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor column */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">أقسام الصفحة</h2>
          <Button onClick={save} disabled={pending} size="sm">
            <Save size={14} />
            {pending ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">
                  {SECTION_TYPE_LABELS[section.type]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-ink-faint hover:bg-surface-subtle disabled:opacity-30"
                    aria-label="نقل للأعلى"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === sections.length - 1}
                    className="rounded p-1 text-ink-faint hover:bg-surface-subtle disabled:opacity-30"
                    aria-label="نقل للأسفل"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => remove(index)}
                    className="rounded p-1 text-danger hover:bg-danger/10"
                    aria-label="حذف القسم"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {section.type === 'hero' && (
                <div className="flex flex-col gap-3">
                  <Input
                    label="العنوان الرئيسي"
                    value={section.headline}
                    onChange={(e) => update(index, { headline: e.target.value })}
                  />
                  <Input
                    label="العنوان الفرعي"
                    value={section.subheadline}
                    onChange={(e) => update(index, { subheadline: e.target.value })}
                  />
                  <Input
                    label="نص الزر"
                    value={section.ctaLabel}
                    onChange={(e) => update(index, { ctaLabel: e.target.value })}
                  />
                  <ImageUploadField
                    label="صورة القسم الرئيسي (اختياري)"
                    workspaceId={workspaceId}
                    landingPageId={pageId}
                    value={section.imageUrl}
                    onChange={(url) => update(index, { imageUrl: url })}
                  />
                </div>
              )}

              {section.type === 'features' && (
                <div className="flex flex-col gap-3">
                  <Input
                    label="عنوان القسم"
                    value={section.title}
                    onChange={(e) => update(index, { title: e.target.value })}
                  />
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-1 gap-2 rounded-md bg-surface-subtle p-3 sm:grid-cols-2">
                      <Input
                        label={`عنوان الميزة ${itemIndex + 1}`}
                        value={item.title}
                        onChange={(e) => {
                          const items = [...section.items];
                          items[itemIndex] = { ...item, title: e.target.value };
                          update(index, { items });
                        }}
                      />
                      <Input
                        label="الوصف"
                        value={item.description}
                        onChange={(e) => {
                          const items = [...section.items];
                          items[itemIndex] = { ...item, description: e.target.value };
                          update(index, { items });
                        }}
                      />
                      <div className="sm:col-span-2">
                        <ImageUploadField
                          label={`صورة الميزة ${itemIndex + 1} (اختياري)`}
                          workspaceId={workspaceId}
                          landingPageId={pageId}
                          value={item.imageUrl}
                          onChange={(url) => {
                            const items = [...section.items];
                            items[itemIndex] = { ...item, imageUrl: url };
                            update(index, { items });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.type === 'cta' && (
                <div className="flex flex-col gap-3">
                  <Input
                    label="العنوان"
                    value={section.headline}
                    onChange={(e) => update(index, { headline: e.target.value })}
                  />
                  <Input
                    label="نص الزر"
                    value={section.buttonLabel}
                    onChange={(e) => update(index, { buttonLabel: e.target.value })}
                  />
                </div>
              )}

              {section.type === 'form' && (
                <div className="flex flex-col gap-3">
                  <Input
                    label="عنوان النموذج"
                    value={section.title}
                    onChange={(e) => update(index, { title: e.target.value })}
                  />
                  <Input
                    label="وصف مختصر"
                    value={section.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                  />
                  <Input
                    label="نص زر الإرسال"
                    value={section.submitLabel}
                    onChange={(e) => update(index, { submitLabel: e.target.value })}
                  />
                  <Input
                    label="رسالة واتساب بعد الإرسال (استخدم {name} لاسم العميل)"
                    value={section.whatsappMessageTemplate}
                    onChange={(e) => update(index, { whatsappMessageTemplate: e.target.value })}
                  />
                </div>
              )}

              {section.type === 'testimonials' && (
                <div className="flex flex-col gap-3">
                  <Input
                    label="عنوان القسم"
                    value={section.title}
                    onChange={(e) => update(index, { title: e.target.value })}
                  />
                  <p className="text-xs text-ink-faint">
                    أضف واعرض/أخفِ الشهادات نفسها من صفحة{' '}
                    <a href="/testimonials" target="_blank" className="text-brand-600 underline">آراء العملاء</a>.
                  </p>
                </div>
              )}

              {section.type === 'appointment_booking' && (
                <div className="flex flex-col gap-3">
                  <Input
                    label="عنوان القسم"
                    value={section.title}
                    onChange={(e) => update(index, { title: e.target.value })}
                  />
                  <Input
                    label="وصف مختصر"
                    value={section.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                  />
                  <Input
                    label="نص زر التأكيد"
                    value={section.submitLabel}
                    onChange={(e) => update(index, { submitLabel: e.target.value })}
                  />
                  <p className="text-xs text-ink-faint">
                    اضبط أيام وساعات العمل من{' '}
                    <a href="/settings" target="_blank" className="text-brand-600 underline">الإعدادات</a>.
                  </p>
                </div>
              )}

              {section.type === 'footer' && (
                <Input
                  label="نص التذييل"
                  value={section.text}
                  onChange={(e) => update(index, { text: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex-1">
            <Select
              label="إضافة قسم جديد"
              value={newType}
              onChange={(e) => setNewType(e.target.value as Section['type'])}
            >
              {ADDABLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SECTION_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" onClick={addSection}>
            <Plus size={16} />
            إضافة
          </Button>
        </div>
      </div>

      {/* Live preview column */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink">معاينة مباشرة</h2>
        <div className="max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-surface" dir="rtl">
          {sections.map((section, i) => (
            <SectionRenderer key={i} section={section} whatsappNumber={whatsappNumber} preview />
          ))}
          {sections.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-faint">أضف قسمًا لرؤية المعاينة.</p>
          )}
        </div>
      </div>
    </div>
  );
}
