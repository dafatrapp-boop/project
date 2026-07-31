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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={arabicFont.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
