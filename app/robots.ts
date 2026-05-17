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
        // /sales is the salesperson portal — closed to non-salespeople,
        // but the URL pattern was missing from the disallow list. Bots
        // that learn /sales via referer logs would otherwise try to
        // index it and get a redirect-to-login that wastes their
        // crawl budget on us for nothing.
        disallow: ['/dashboard', '/admin', '/auth', '/api', '/sales'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
