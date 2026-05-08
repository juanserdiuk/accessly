import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', '@sparticuz/chromium-min', 'puppeteer-core'],

  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },

  turbopack: {},

  webpack: (config) => {
    config.externals = [...(config.externals || []), '@sparticuz/chromium', 'puppeteer-core']
    return config
  },
};

export default nextConfig;
