import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import pkg from './package.json' with { type: 'json' }

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Build a human-readable version string. Vercel exposes the commit SHA in
// VERCEL_GIT_COMMIT_SHA; locally we fall back to the package.json version.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7)
const buildVersion = sha ? `${pkg.version}+${sha}` : pkg.version

// Baseline security headers applied to every response. See ClearShield's
// next.config.ts for the rationale on each. Skips /api/badge/ because the
// SVG badge is intentionally embeddable in customer marketing pages.
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', '@sparticuz/chromium-min', 'puppeteer-core', 'pdfjs-dist'],

  env: {
    NEXT_PUBLIC_APP_VERSION: buildVersion,
  },

  turbopack: {},

  async headers() {
    return [
      {
        source: '/((?!api/badge/).*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), '@sparticuz/chromium', 'puppeteer-core']
    return config
  },
}

export default withNextIntl(nextConfig)
