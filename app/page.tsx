import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import ScanSection from '@/components/ScanSection'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import ExpertVideo from '@/components/ExpertVideo'
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

  return (
    <>
      <Nav />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <ScanSection />
        <Features />
        <ExpertVideo />
        <Testimonials />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
