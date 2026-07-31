import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/p/'],
        disallow: ['/dashboard', '/leads', '/campaigns', '/analytics', '/team', '/settings', '/onboarding', '/api/', '/invite/'],
      },
    ],
  };
}
