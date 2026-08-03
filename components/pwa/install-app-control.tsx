'use client';

import { useState } from 'react';
import { Download, Share, SquarePlus, ChevronLeft } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Modal } from '@/components/ui/modal';
import { usePWA } from './pwa-provider';

function IOSInstructionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="تثبيت التطبيق على الشاشة الرئيسية">
      <ol className="flex flex-col gap-4">
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-body-sm font-semibold text-brand-600">
            1
          </span>
          <p className="text-body-sm text-ink">
            اضغط على أيقونة المشاركة{' '}
            <Share size={14} className="inline-block align-text-bottom text-ink-muted" /> في شريط
            المتصفح.
          </p>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-body-sm font-semibold text-brand-600">
            2
          </span>
          <p className="text-body-sm text-ink">
            اختر <span className="font-medium">"إضافة إلى الشاشة الرئيسية"</span>{' '}
            <SquarePlus size={14} className="inline-block align-text-bottom text-ink-muted" />.
          </p>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-body-sm font-semibold text-brand-600">
            3
          </span>
          <p className="text-body-sm text-ink">اضغط "إضافة" — سيظهر تطبيق SocialSales OS كأي تطبيق آخر.</p>
        </li>
      </ol>
    </Modal>
  );
}

/**
 * Compact header icon button. Placed next to ThemeToggle/NotificationBell
 * in components/layout/header.tsx — reuses the exact same button
 * treatment those controls already use, so it reads as a native part
 * of the header rather than a bolted-on banner. Renders nothing at all
 * once installed or when installation isn't currently possible.
 */
export function HeaderInstallButton() {
  const { canInstall, isIOSInstallable, isInstalled, promptInstall } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || (!canInstall && !isIOSInstallable)) return null;

  return (
    <>
      <Tooltip label="تثبيت التطبيق">
        <button
          onClick={() => (canInstall ? promptInstall() : setShowIOSModal(true))}
          aria-label="تثبيت التطبيق"
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
        >
          <Download size={19} strokeWidth={2} />
        </button>
      </Tooltip>
      <IOSInstructionsModal open={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  );
}

/**
 * Row for the mobile "More" hub (app/(dashboard)/more/page.tsx),
 * matching that page's existing renderRow visual pattern exactly
 * (icon chip + label/description + chevron). This is the fallback
 * entry point for anyone who dismissed/missed the header button, and
 * the *only* entry point on iOS, where there's no header real estate
 * reason to duplicate it and the instructions modal is a better fit
 * inside a full row.
 */
export function InstallMenuRow() {
  const { canInstall, isIOSInstallable, isInstalled, promptInstall } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || (!canInstall && !isIOSInstallable)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (canInstall ? promptInstall() : setShowIOSModal(true))}
        className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-start transition-colors hover:bg-surface-subtle"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Download size={18} strokeWidth={2} />
        </span>
        <span className="flex-1">
          <span className="block text-body-sm font-medium text-ink">تثبيت التطبيق</span>
          <span className="block text-caption text-ink-muted">أضِف SocialSales OS إلى شاشتك الرئيسية</span>
        </span>
        <ChevronLeft size={16} className="icon-flip shrink-0 text-ink-faint" />
      </button>
      <IOSInstructionsModal open={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  );
}
