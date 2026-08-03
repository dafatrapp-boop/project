'use client';

import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/lib/auth/actions';

/**
 * There was previously no way to sign out of the product at all short
 * of clearing cookies manually. Rendered in two places: the desktop
 * Sidebar (icon-rail aware) and the mobile "More" page account section.
 */
export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        title={collapsed ? 'تسجيل الخروج' : undefined}
        className={cn(
          'mt-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-body-sm font-medium text-ink-faint transition-colors hover:bg-danger-50 hover:text-danger',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
          collapsed && 'justify-center'
        )}
      >
        <LogOut size={17} className="shrink-0" />
        {!collapsed && 'تسجيل الخروج'}
      </button>
    </form>
  );
}
