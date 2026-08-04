import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs on every request:
 * 1. Refreshes the Supabase auth session (keeps cookies valid).
 * 2. Redirects unauthenticated users away from protected (dashboard) routes.
 * 3. Redirects authenticated users away from auth pages (login/signup).
 *
 * Tenant/workspace scoping itself is enforced at the database level via
 * RLS (see supabase/migrations) — this middleware only gates route access,
 * it is not the security boundary for data.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/reset-password');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/reminders') ||
    pathname.startsWith('/landing-pages') ||
    pathname.startsWith('/campaigns') ||
    pathname.startsWith('/more') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/activity') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding') ||
    // These four route groups (orders/appointments/testimonials/
    // automations) were added after the last middleware audit
    // (PRODUCTION_AUDIT.md's "Team + Plans" pass) and were never added
    // here — found during this review. Not an actual security hole
    // (every page under them still calls requireWorkspace() itself,
    // which redirects unauthenticated users regardless), just the same
    // extra-round-trip gap that audit already fixed for other routes.
    pathname.startsWith('/orders') ||
    pathname.startsWith('/appointments') ||
    pathname.startsWith('/testimonials') ||
    pathname.startsWith('/automations') ||
    pathname.startsWith('/errors') ||
    pathname.startsWith('/api/exports') ||
    pathname.startsWith('/api/search') ||
    // /api/push/vapid-public-key deliberately excluded — it's a
    // read-only, non-secret value (see that route's own comment) the
    // service worker must be able to fetch even if the user's session
    // has expired, e.g. while recovering from pushsubscriptionchange.
    (pathname.startsWith('/api/push') && !pathname.startsWith('/api/push/vapid-public-key')) ||
    pathname.startsWith('/api/stripe/checkout') ||
    pathname.startsWith('/api/stripe/portal');

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and image optimization,
     * public landing-page routes served under /p/[slug], and
     * server-to-server routes with no user session to refresh (the
     * Stripe webhook, and the reminders cron endpoint — both
     * authenticate via their own bearer secret, not a session cookie).
     */
    '/((?!_next/static|_next/image|favicon.ico|p/|api/public|api/stripe/webhook|api/cron|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
};
