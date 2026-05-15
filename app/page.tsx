import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import ScanSection from '@/components/ScanSection'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import Pricing from '@/components/Pricing'
import Faq from '@/components/Faq'
import Footer from '@/components/Footer'

interface Props {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>
}

export default async function Home({ searchParams }: Props) {
  // Supabase auth confirmation links default to ${SiteURL}/?code=... — landing
  // on the homepage with no handler. Catch that case here and bounce straight
  // to /auth/callback where exchangeCodeForSession runs. This is the
  // defense-in-depth fix for misconfigured Supabase email templates / missing
  // Redirect URL allowlist entries.
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }
  if (params.error) {
    // Surfaces auth errors (e.g. expired tokens) on the login page instead of
    // silently dropping the user on the homepage with mysterious URL params.
    redirect(`/login?error=auth`)
  }

  // JSON-LD structured data — gives search engines a machine-readable
  // description of the product, organization, and FAQ. Boosts SEO rich
  // results (FAQ accordions in SERPs, knowledge-panel data, etc.).
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Accessly',
        url: SITE_URL,
        logo: `${SITE_URL}/icon`,
        founder: { '@type': 'Person', name: 'Juan Serdiuk' },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contact@accessly.us',
          contactType: 'customer support',
          availableLanguage: ['en', 'es', 'pt'],
        },
        sameAs: [
          'https://www.linkedin.com/company/accessly-web-scanner/',
          'https://www.linkedin.com/in/juan-serdiuk-72962b99',
        ],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: 'Accessly',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: 'WCAG 2.2 AA & AAA accessibility scanner. Audit any website in 12 seconds, get actionable reports with real code fixes.',
        offers: [
          { '@type': 'Offer', name: 'Free',   price: '0',  priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pro',    price: '29', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Agency', price: '99', priceCurrency: 'USD' },
        ],
        author: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Accessly',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: ['en', 'es'],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <ScanSection />
        <Features />
        <Testimonials />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
