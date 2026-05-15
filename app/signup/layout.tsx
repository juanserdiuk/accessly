import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up free — Accessly',
  description: 'Create an Accessly account. Free tier: 3 WCAG 2.2 scans with full reports, no credit card. Built by a senior accessibility consultant with 18 years of audits.',
  alternates: { canonical: '/signup' },
  robots: { index: true, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
