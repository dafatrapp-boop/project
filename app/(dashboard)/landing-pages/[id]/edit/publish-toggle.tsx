'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { togglePublishAction } from '../../actions';

export function PublishToggle({ pageId, isPublished }: { pageId: string; isPublished: boolean }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Button
      variant={isPublished ? 'secondary' : 'primary'}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await togglePublishAction(pageId, !isPublished);
          show(isPublished ? 'تم إلغاء نشر الصفحة' : 'تم نشر الصفحة بنجاح', 'success');
        })
      }
    >
      {isPublished ? 'إلغاء النشر' : 'نشر الصفحة'}
    </Button>
  );
}
