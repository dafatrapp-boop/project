import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
