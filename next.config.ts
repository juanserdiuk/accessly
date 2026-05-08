import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', '@sparticuz/chromium-min', 'puppeteer-core', 'pdfjs-dist'],

  turbopack: {},

  webpack: (config) => {
    config.externals = [...(config.externals || []), '@sparticuz/chromium', 'puppeteer-core']
    return config
  },
}

export default withNextIntl(nextConfig)
