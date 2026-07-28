import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The vendor portal and internal pitch pages stay out of search results.
      disallow: ['/acceso', '/pitch'],
    },
  };
}
