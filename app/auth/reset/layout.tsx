import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset password — Accessly',
  description: 'Set a new password for your Accessly account.',
  alternates: { canonical: '/auth/reset' },
  // Auth-related pages shouldn't be indexed by search engines.
  robots: { index: false, follow: false },
}

export default function ResetLayout({ children }: { children: React.ReactNode }) {
  return children
}
