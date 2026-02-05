import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://parsefit.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/how-it-works', '/sign-up'],
        disallow: ['/api/', '/dashboard', '/scan', '/history', '/settings', '/sign-in'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
