'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { updatePageMetaAction } from '../../actions';

export function PageSettingsForm({
  pageId,
  title,
  whatsappNumber,
  metaTitle,
  metaDescription,
}: {
  pageId: string;
  title: string;
  whatsappNumber: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}) {
  const { show } = useToast();

  return (
    <form
      action={async (formData) => {
        await updatePageMetaAction(pageId, formData);
        show('تم حفظ إعدادات الصفحة', 'success');
      }}
      className="flex flex-col gap-4"
    >
      <Input name="title" label="عنوان الصفحة (داخلي)" defaultValue={title} required />
      <Input
        name="whatsappNumber"
        label="رقم واتساب (مع رمز الدولة)"
        placeholder="9665xxxxxxxx"
        defaultValue={whatsappNumber ?? ''}
      />
      <Input name="metaTitle" label="عنوان محركات البحث (SEO)" defaultValue={metaTitle ?? ''} />
      <Input
        name="metaDescription"
        label="وصف محركات البحث (SEO)"
        defaultValue={metaDescription ?? ''}
      />
      <Button type="submit" variant="secondary" className="self-start">
        حفظ الإعدادات
      </Button>
    </form>
  );
}
