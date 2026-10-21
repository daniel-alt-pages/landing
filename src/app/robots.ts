import type { MetadataRoute } from 'next';

const SITE_URL = 'https://simulacros-sg.web.app';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/landing',
        '/demo',
        '/login',
      ],
      disallow: [
        '/admin',
        '/admin-panel',
        '/coordinador',
        '/estudiante',
        '/debug-dashboard',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
