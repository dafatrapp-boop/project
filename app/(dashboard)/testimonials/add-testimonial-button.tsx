'use client';

import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ImageUploadField } from '@/components/landing-page/image-upload-field';
import { createTestimonialAction } from './actions';

export function AddTestimonialButton({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState(5);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        إضافة شهادة
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="إضافة شهادة عميل">
        <form action={createTestimonialAction} className="flex flex-col gap-4">
          <Input name="customerName" label="اسم العميل" placeholder="مثال: منى العتيبي" required />
          <Input name="subtitle" label="المدينة أو المسمى الوظيفي (اختياري)" placeholder="مثال: الرياض" />

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">التقييم</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} نجوم`}
                >
                  <Star
                    size={22}
                    className={n <= rating ? 'fill-warning text-warning' : 'text-border'}
                  />
                </button>
              ))}
            </div>
            <input type="hidden" name="rating" value={rating} />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">نص الشهادة</span>
            <textarea
              name="body"
              required
              rows={4}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="ماذا قال العميل عن تجربته؟"
            />
          </label>

          <ImageUploadField
            label="صورة العميل (اختياري)"
            workspaceId={workspaceId}
            landingPageId="testimonials"
            value={avatarUrl}
            onChange={setAvatarUrl}
          />
          <input type="hidden" name="avatarUrl" value={avatarUrl ?? ''} />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
