import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import pkg from './package.json' with { type: 'json' }

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Build a human-readable version string. Vercel exposes the commit SHA in
// VERCEL_GIT_COMMIT_SHA; locally we fall back to the package.json version.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7)
const buildVersion = sha ? `${pkg.version}+${sha}` : pkg.version

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', '@sparticuz/chromium-min', 'puppeteer-core', 'pdfjs-dist'],

  env: {
    NEXT_PUBLIC_APP_VERSION: buildVersion,
  },

  turbopack: {},

  webpack: (config) => {
    config.externals = [...(config.externals || []), '@sparticuz/chromium', 'puppeteer-core']
    return config
  },
}

export default withNextIntl(nextConfig)
