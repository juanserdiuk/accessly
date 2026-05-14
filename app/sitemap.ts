import type { MetadataRoute } from 'next'

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us'
).replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    { url: `${BASE_URL}/`,        lastModified, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/about`,   lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/signup`,  lastModified, changeFrequency: 'yearly',  priority: 0.7 },
    { url: `${BASE_URL}/sitemap`, lastModified, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE_URL}/login`,   lastModified, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,   lastModified, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
