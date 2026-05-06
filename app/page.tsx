import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Scanner from '@/components/Scanner'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Scanner />
      <Features />
      <Pricing />
      <Footer />
    </main>
  )
}