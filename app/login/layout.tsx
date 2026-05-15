import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in — Accessly',
  description: 'Sign in to your Accessly account. WCAG accessibility scanner for developers, consultants, and agencies.',
  alternates: { canonical: '/login' },
  robots: { index: true, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
