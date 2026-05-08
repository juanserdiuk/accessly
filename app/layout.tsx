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

const BASE_URL = 'https://accessly.io'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Accessly — WCAG Accessibility Scanner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessly — WCAG Accessibility Scanner',
    description: 'Scan any website for WCAG 2.2 accessibility issues in seconds. Actionable reports, compliance tracking, and team workflows — free to start.',
    images: ['/og-image.png'],
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
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
