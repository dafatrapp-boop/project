'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Image as ImageIcon,
  LayoutGrid,
  MousePointerClick,
  ClipboardList,
  MessageSquareQuote,
  CalendarClock,
  PanelBottom,
  Monitor,
  Smartphone,
  BarChart3,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
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
  'social_proof',
  'form',
  'testimonials',
  'faq',
  'appointment_booking',
  'cta',
  'footer',
];

const SECTION_TYPE_ICON: Record<Section['type'], LucideIcon> = {
  hero: ImageIcon,
  features: LayoutGrid,
  social_proof: BarChart3,
  cta: MousePointerClick,
  form: ClipboardList,
  testimonials: MessageSquareQuote,
  appointment_booking: CalendarClock,
  faq: HelpCircle,
  footer: PanelBottom,
};

/** Best-effort one-line summary shown when a section card is collapsed. */
function sectionSummary(section: Section): string {
  switch (section.type) {
    case 'hero':
      return section.headline || 'بدون عنوان بعد';
    case 'features':
      return `${section.items.length} ميزة`;
    case 'social_proof':
      return `${section.stats.length} رقم`;
    case 'cta':
      return section.headline || 'بدون عنوان بعد';
    case 'form':
      return section.title || 'بدون عنوان بعد';
    case 'testimonials':
      return section.title || 'بدون عنوان بعد';
    case 'appointment_booking':
      return section.title || 'بدون عنوان بعد';
    case 'faq':
      return `${section.items.length} سؤال`;
    case 'footer':
      return section.text || '—';
  }
}

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
  const [savedSections, setSavedSections] = useState<Section[]>(initialSections);
  const [newType, setNewType] = useState<Section['type']>('hero');
  const [expanded, setExpanded] = useState<number | null>(initialSections.length > 0 ? 0 : null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const dirty = useMemo(() => JSON.stringify(sections) !== JSON.stringify(savedSections), [sections, savedSections]);

  function update(index: number, patch: Partial<Section>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? ({ ...s, ...patch } as Section) : s))
    );
  }

  function remove(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
    setExpanded((prev) => (prev === index ? null : prev));
  }

  function move(index: number, direction: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setExpanded(index + direction);
  }

  function addSection() {
    setSections((prev) => {
      const next = [...prev, createDefaultSection(newType)];
      setExpanded(next.length - 1);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      await updateSectionsAction(pageId, sections);
      setSavedSections(sections);
      show('تم حفظ التغييرات', 'success');
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor column */}
      <div className="flex flex-col gap-4">
        {/* Sticky save toolbar — always reachable regardless of scroll
            position down a long section list. Shows a live "unsaved
            changes" state instead of just a static Save button. */}
        <div className="sticky top-[calc(3.5rem+1px)] z-10 -mx-1 flex items-center justify-between rounded-lg border border-border bg-surface-overlay/95 px-3 py-2.5 shadow-subtle backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-body-sm font-semibold text-ink">أقسام الصفحة</h2>
            <Badge tone="neutral" size="sm">{sections.length}</Badge>
            {dirty && <Badge tone="warning" size="sm" dot>تغييرات غير محفوظة</Badge>}
          </div>
          <Button onClick={save} disabled={pending || !dirty} size="sm">
            <Save size={14} />
            {pending ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </div>

        {sections.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="لا توجد أقسام بعد"
            description="أضف أول قسم من القائمة أدناه لبدء بناء صفحتك."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {sections.map((section, index) => {
              const Icon = SECTION_TYPE_ICON[section.type];
              const isOpen = expanded === index;
              return (
                <div key={index} className="rounded-lg border border-border bg-surface shadow-subtle">
                  <div className="flex items-center gap-2 p-3">
                    <button
                      onClick={() => setExpanded(isOpen ? null : index)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                      aria-expanded={isOpen}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-body-sm font-medium text-ink">
                          {SECTION_TYPE_LABELS[section.type]}
                        </span>
                        {!isOpen && (
                          <span className="block truncate text-caption text-ink-faint">{sectionSummary(section)}</span>
                        )}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton variant="ghost" size="sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="نقل للأعلى">
                        <ChevronUp size={15} />
                      </IconButton>
                      <IconButton variant="ghost" size="sm" onClick={() => move(index, 1)} disabled={index === sections.length - 1} aria-label="نقل للأسفل">
                        <ChevronDown size={15} />
                      </IconButton>
                      <IconButton variant="ghost" size="sm" onClick={() => remove(index)} aria-label="حذف القسم" className="hover:bg-danger-50 hover:text-danger">
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </div>

                  {/* Animated collapse using a 0fr/1fr grid track — avoids
                      a fixed max-height guess while still animating. */}
                  <div
                    className="grid overflow-hidden transition-[grid-template-rows] duration-base ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="min-h-0">
                      <div className="border-t border-border p-4">
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

                        {section.type === 'social_proof' && (
                          <div className="flex flex-col gap-3">
                            {section.stats.map((stat, statIndex) => (
                              <div key={statIndex} className="grid grid-cols-1 gap-2 rounded-md bg-surface-subtle p-3 sm:grid-cols-[1fr_1fr_auto]">
                                <Input
                                  label="الرقم"
                                  value={stat.value}
                                  onChange={(e) => {
                                    const stats = [...section.stats];
                                    stats[statIndex] = { ...stat, value: e.target.value };
                                    update(index, { stats });
                                  }}
                                />
                                <Input
                                  label="الوصف"
                                  value={stat.label}
                                  onChange={(e) => {
                                    const stats = [...section.stats];
                                    stats[statIndex] = { ...stat, label: e.target.value };
                                    update(index, { stats });
                                  }}
                                />
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  className="self-end hover:bg-danger-50 hover:text-danger"
                                  aria-label="حذف الرقم"
                                  onClick={() => {
                                    const stats = section.stats.filter((_, i) => i !== statIndex);
                                    update(index, { stats });
                                  }}
                                >
                                  <Trash2 size={15} />
                                </IconButton>
                              </div>
                            ))}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="self-start"
                              onClick={() => update(index, { stats: [...section.stats, { value: '', label: '' }] })}
                            >
                              <Plus size={14} />
                              إضافة رقم
                            </Button>
                          </div>
                        )}

                        {section.type === 'faq' && (
                          <div className="flex flex-col gap-3">
                            <Input
                              label="عنوان القسم"
                              value={section.title}
                              onChange={(e) => update(index, { title: e.target.value })}
                            />
                            {section.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex flex-col gap-2 rounded-md bg-surface-subtle p-3">
                                <Input
                                  label={`السؤال ${itemIndex + 1}`}
                                  value={item.question}
                                  onChange={(e) => {
                                    const items = [...section.items];
                                    items[itemIndex] = { ...item, question: e.target.value };
                                    update(index, { items });
                                  }}
                                />
                                <Input
                                  label="الإجابة"
                                  value={item.answer}
                                  onChange={(e) => {
                                    const items = [...section.items];
                                    items[itemIndex] = { ...item, answer: e.target.value };
                                    update(index, { items });
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="self-start hover:bg-danger-50 hover:text-danger"
                                  onClick={() => {
                                    const items = section.items.filter((_, i) => i !== itemIndex);
                                    update(index, { items });
                                  }}
                                >
                                  <Trash2 size={14} />
                                  حذف السؤال
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="self-start"
                              onClick={() =>
                                update(index, { items: [...section.items, { question: '', answer: '' }] })
                              }
                            >
                              <Plus size={14} />
                              إضافة سؤال
                            </Button>
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
                            <p className="text-caption text-ink-faint">
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
                            <p className="text-caption text-ink-faint">
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

      {/* Live preview column — sticky so it stays in view while the
          (potentially long) editor column scrolls independently. */}
      <div className="lg:sticky lg:top-[calc(3.5rem+1px)] lg:self-start">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-body-sm font-semibold text-ink">معاينة مباشرة</h2>
          <div role="tablist" className="inline-flex gap-1 rounded-md bg-surface-sunken p-0.5">
            <button
              onClick={() => setPreviewDevice('desktop')}
              aria-label="معاينة سطح المكتب"
              aria-pressed={previewDevice === 'desktop'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded transition-colors',
                previewDevice === 'desktop' ? 'bg-surface text-ink shadow-subtle' : 'text-ink-faint hover:text-ink'
              )}
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              aria-label="معاينة الجوال"
              aria-pressed={previewDevice === 'mobile'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded transition-colors',
                previewDevice === 'mobile' ? 'bg-surface text-ink shadow-subtle' : 'text-ink-faint hover:text-ink'
              )}
            >
              <Smartphone size={14} />
            </button>
          </div>
        </div>
        <div
          className={cn(
            'max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-card transition-all duration-base',
            previewDevice === 'mobile' && 'mx-auto max-w-[380px]'
          )}
          dir="rtl"
        >
          {sections.map((section, i) => (
            <SectionRenderer key={i} section={section} whatsappNumber={whatsappNumber} preview />
          ))}
          {sections.length === 0 && (
            <p className="p-8 text-center text-body-sm text-ink-faint">أضف قسمًا لرؤية المعاينة.</p>
          )}
        </div>
      </div>
    </div>
  );
}
