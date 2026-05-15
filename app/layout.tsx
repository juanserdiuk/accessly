import type { Metadata } from 'next'
import { Inter, Bricolage_Grotesque } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://accessly.us'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Accessly — WCAG Accessibility Scanner',
  description: 'Scan any website for WCAG 2.2 accessibility issues in seconds. Get actionable reports, track compliance over time, and fix issues fast. Free to start.',
  keywords: [
    'accessibility scanner',
    'WCAG compliance',
    'WCAG 2.2',
    'web accessibility',
    'accessibility audit',
    'ADA compliance',
    'axe-core',
    'screen reader testing',
    'accessibility checker',
    'WCAG AA',
    'WCAG AAA',
    'accessibility testing tool',
    'website compliance checker',
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'Accessly',
    title: 'Accessly — WCAG Accessibility Scanner',
    description: 'Scan any website for WCAG 2.2 accessibility issues in seconds. Actionable reports, compliance tracking, and team workflows — free to start.',
    // Open Graph image generated dynamically by app/opengraph-image.tsx
    // so social previews actually render (no static /og-image.png exists).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessly — WCAG Accessibility Scanner',
    description: 'Scan any website for WCAG 2.2 accessibility issues in seconds. Actionable reports, compliance tracking, and team workflows — free to start.',
    // Twitter card auto-uses app/opengraph-image.tsx when no static image
    // is set, via Next.js convention.
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${bricolage.variable}`}>
      {/* overflow-x-clip on body is a global safety net so no decorative
          element (gradient blurs, animated orbs) can ever cause horizontal
          scroll on mobile. Uses `clip` not `hidden` so position:sticky on
          children still works. */}
      <body suppressHydrationWarning className="overflow-x-clip">
        {/* Skip-to-content link — invisible until focused via keyboard. Critical
            a11y feature for keyboard-only users and screen-reader users so they
            don't have to tab through the entire site header on every page. */}
        <a
          href="#main-content"
          className="
            sr-only focus:not-sr-only
            focus:fixed focus:top-3 focus:left-3 focus:z-[100]
            focus:bg-slate-900 focus:text-white focus:font-semibold focus:text-sm
            focus:px-4 focus:py-2.5 focus:rounded-lg focus:shadow-2xl
            focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
          "
        >
          Skip to main content
        </a>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
