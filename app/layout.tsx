import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import { PWAProvider } from '@/components/pwa/pwa-provider';
import './globals.css';

// Arabic-first typography. Weights chosen to match a premium SaaS
// hierarchy: 400 body / 500 emphasis / 600-700 headings.
const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SocialSales OS',
  description: 'حوّل زوار إعلاناتك وصفحات التواصل الاجتماعي إلى عملاء فعليين',
  // Next.js auto-serves app/manifest.ts at /manifest.webmanifest and
  // links it here — no extra <link> tag needed.
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    // Standalone launch on iOS when added to the home screen.
    capable: true,
    title: 'SocialSales OS',
    statusBarStyle: 'default',
  },
  formatDetection: {
    // Arabic-first, business phone numbers throughout the UI — iOS's
    // auto-linkification would otherwise mangle these into tel: links.
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#4938e7',
  width: 'device-width',
  initialScale: 1,
  // Allow pinch-zoom (accessibility) but prevent the page from
  // rubber-banding oddly in standalone mode.
  viewportFit: 'cover',
};

// Phase 2 — dark mode bootstrap. Runs before paint (blocking, inline)
// so there is no light-mode flash for users with a saved 'dark'
// preference or an OS-level dark preference and no saved choice yet.
// Reads/writes only `localStorage['ss-theme']` — no business data,
// no network call, nothing that touches auth/Supabase/RLS.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('ss-theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={arabicFont.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ToastProvider>
          <PWAProvider>{children}</PWAProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
