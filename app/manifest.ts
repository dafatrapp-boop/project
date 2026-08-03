import type { MetadataRoute } from 'next';

/**
 * PWA install manifest.
 *
 * Uses Next.js 14's native App Router metadata route convention — no
 * plugin, no extra dependency. Next automatically serves this at
 * `/manifest.webmanifest` and links it from `<head>` via the
 * `metadata.manifest` export in app/layout.tsx.
 *
 * `lang`/`dir` match the product (Arabic-first, RTL) — see app/layout.tsx.
 * Colors mirror the CSS custom properties in app/globals.css
 * (`--brand-500` for theme_color, `--surface`-equivalent white for
 * background_color) so the OS-drawn splash screen matches the app's
 * own light-mode surface instead of a mismatched default.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/dashboard',
    name: 'SocialSales OS',
    short_name: 'SocialSales',
    description: 'حوّل زوار إعلاناتك وصفحات التواصل الاجتماعي إلى عملاء فعليين',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'browser'],
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#4938e7',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Quick actions on long-press of the installed app icon (Android /
    // desktop). Each target is a real, already-existing route — nothing
    // new was added to satisfy this list.
    shortcuts: [
      {
        name: 'العملاء المحتملون',
        short_name: 'العملاء',
        description: 'عرض قائمة العملاء المحتملين',
        url: '/leads?source=pwa-shortcut',
        icons: [{ src: '/icons/shortcut-leads.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'الحملات',
        short_name: 'الحملات',
        description: 'عرض الحملات الإعلانية',
        url: '/campaigns?source=pwa-shortcut',
        icons: [{ src: '/icons/shortcut-campaigns.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'التحليلات',
        short_name: 'التحليلات',
        description: 'عرض تقارير الأداء',
        url: '/analytics?source=pwa-shortcut',
        icons: [{ src: '/icons/shortcut-analytics.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
  };
}
