import { Suspense } from 'react';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import { HeaderSkeleton } from '@/components/layout/header-skeleton';
import { SidebarServer } from '@/components/layout/sidebar-server';
import { SidebarSkeleton } from '@/components/layout/sidebar-skeleton';
import { OnboardingBannerServer } from '@/components/layout/onboarding-banner-server';
import { PWAProvider } from '@/components/pwa/pwa-provider';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

// Every page under this layout is per-user data (workspace, leads,
// campaigns, settings...). Forcing dynamic rendering here — on top of
// the no-store fetch fix in lib/supabase/server.ts — makes sure this
// entire section of the app is never eligible for Next.js's Full
// Route Cache, in addition to bypassing the fetch-level Data Cache.
export const dynamic = 'force-dynamic';

/**
 * Sidebar, the onboarding banner, and the header each need workspace
 * data, but none of that should block `{children}` — the actual page —
 * from streaming. Previously this layout was one big sequential await
 * chain in front of everything, including the page content itself.
 * Splitting each data-dependent piece into its own <Suspense> boundary
 * means:
 *  - The static shell shows real dimensions instantly (skeletons, not a
 *    blank screen) while requireWorkspace() is still in flight.
 *  - `{children}` (the route segment) starts rendering in parallel,
 *    not after the shell resolves — it gets its own loading.tsx per
 *    route already.
 *  - All three data-dependent pieces share one cached requireWorkspace()
 *    call (see lib/workspace.ts) instead of each re-querying.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PWAProvider>
      <div className="flex min-h-screen">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarServer />
        </Suspense>
        <div className="flex-1 pb-16 md:pb-0">
          <Suspense fallback={null}>
            <OnboardingBannerServer />
          </Suspense>
          <Suspense fallback={<HeaderSkeleton />}>
            <Header />
          </Suspense>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            <PullToRefresh>{children}</PullToRefresh>
          </main>
        </div>
        <MobileNav />
      </div>
    </PWAProvider>
  );
}
