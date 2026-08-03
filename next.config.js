/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // PWA-only additions — no existing route/header behavior changed.
  async headers() {
    return [
      {
        // The service worker file itself must never be served from a
        // cache (browsers already treat it specially, but some CDNs/
        // proxies don't) — a stale sw.js is the classic way a PWA gets
        // permanently stuck on an old version.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          // Lets this worker (served from /sw.js) control the whole
          // origin scope ('/') instead of defaulting to its own
          // directory — needed since it isn't nested under /pwa/ etc.
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },
};

module.exports = nextConfig;
