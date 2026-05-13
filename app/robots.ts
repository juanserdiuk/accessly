import type { MetadataRoute } from 'next'

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us'
).replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/auth', '/api'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
