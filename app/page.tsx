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

export default function Home() {
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
