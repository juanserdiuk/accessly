import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')

const PRIVACY_DESCRIPTION =
  'How Accessly collects, stores, and uses your data. Plain-English privacy commitments for our WCAG accessibility scanner.'

export const metadata: Metadata = {
  title: 'Privacy Policy — Accessly',
  description: PRIVACY_DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/privacy` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    url: `${BASE_URL}/privacy`,
    siteName: 'Accessly',
    title: 'Privacy Policy — Accessly',
    description: PRIVACY_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — Accessly',
    description: PRIVACY_DESCRIPTION,
    images: ['/opengraph-image'],
  },
}

const EFFECTIVE = 'May 7, 2026'
const CONTACT   = process.env.ADMIN_EMAIL ?? 'hello@accessly.us'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">{title}</h2>
      <div className="space-y-4 text-slate-600 leading-7">{children}</div>
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-800 mb-1.5">{title}</h3>
      <div className="text-slate-600 leading-7">{children}</div>
    </div>
  )
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside ml-5 space-y-1.5">
      {items.map(i => <li key={i}>{i}</li>)}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main id="main-content">

      {/* Hero */}
      <div className="bg-slate-900 px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,212,170,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">Privacy Policy</h1>
          <p className="text-white/50 text-sm">Effective date: {EFFECTIVE}</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white px-6 py-16">
        <div className="max-w-3xl mx-auto">

          {/* Intro */}
          <p className="text-slate-600 leading-7 mb-12">
            Accessly (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the Accessly web accessibility scanning
            platform at accessly.us. This Privacy Policy explains what information we collect, how we use
            it, and what rights you have in relation to it. By using Accessly you agree to the practices
            described below. If you do not agree, please do not use the service.
          </p>

          <Section id="information-we-collect" title="1. Information We Collect">
            <Sub title="Account information">
              When you create an account we collect your email address and, if you choose to provide
              them, your first and last name. This information is used to identify your account and
              communicate with you.
            </Sub>
            <Sub title="Scan data">
              When you run an accessibility scan we store the URL you scanned, the date and time of
              the scan, and the results returned by our scanning engine (including violation counts,
              scores, and structured violation detail). This data is associated with your account and
              used to power your dashboard, reports, and historical trend views.
            </Sub>
            <Sub title="Document data">
              If you use the document scanner feature, your uploaded file is processed in memory
              on our servers to extract accessibility information. We do not permanently store the
              contents of uploaded files. Scan results (metadata and check outcomes) are retained as
              described under Data Retention below.
            </Sub>
            <Sub title="Usage data">
              We automatically collect certain technical information when you use Accessly, including
              your IP address, browser type and version, pages visited, time spent on pages, and
              referring URLs. This data is used in aggregate to understand how the product is used and
              to improve it.
            </Sub>
            <Sub title="Payment information">
              Payments are processed by Stripe. We do not store your full card number, CVV, or bank
              account details on our servers. We receive and store a Stripe customer ID, your
              subscription plan, and billing status so we can manage your account.
            </Sub>
            <Sub title="Contact form submissions">
              If you contact us via the &ldquo;Talk to an Expert&rdquo; form, we collect your name, email
              address, website URL (optional), and message. This information is used solely to respond
              to your inquiry.
            </Sub>
          </Section>

          <Section id="how-we-use" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <Ul items={[
              'Provide, operate, and maintain the Accessly platform',
              'Process transactions and manage your subscription',
              'Send you transactional emails (account confirmation, invoices, password resets)',
              'Respond to your support requests and inquiries',
              'Analyse usage patterns to improve the product',
              'Detect and prevent fraud, abuse, or security incidents',
              'Comply with legal obligations',
            ]} />
            <p>
              We do not sell your personal data to third parties. We do not use your scan data for
              advertising or share it with third parties for their marketing purposes.
            </p>
          </Section>

          <Section id="cookies" title="3. Cookies and Tracking">
            <p>
              Accessly uses cookies and similar technologies to keep you signed in, remember your
              preferences, and understand how you use the platform.
            </p>
            <Sub title="Essential cookies">
              These are required for the service to function. They include authentication session
              cookies set by Supabase. You cannot opt out of essential cookies while using the service.
            </Sub>
            <Sub title="Analytics">
              We may use privacy-respecting analytics tools to understand aggregate usage patterns. No
              personally identifiable data is shared with analytics providers.
            </Sub>
            <p>
              You can control cookies through your browser settings. Disabling essential cookies will
              prevent you from signing in or using authenticated features.
            </p>
          </Section>

          <Section id="third-party" title="4. Third-Party Services">
            <p>
              We rely on the following third-party service providers to operate Accessly. Each provider
              processes data under their own privacy policies and security practices.
            </p>
            <Sub title="Supabase">
              We use Supabase for database storage and user authentication. Your account data, scan
              results, and site watchlist are stored in Supabase-managed PostgreSQL databases hosted on
              AWS infrastructure.{' '}
              <a href="https://supabase.com/privacy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Supabase Privacy Policy →
              </a>
            </Sub>
            <Sub title="Stripe">
              Stripe processes all payment transactions. When you subscribe to a paid plan, Stripe
              collects and stores your payment card details. We receive only non-sensitive billing
              metadata (customer ID, plan status, last-4 digits) from Stripe.{' '}
              <a href="https://stripe.com/privacy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Stripe Privacy Policy →
              </a>
            </Sub>
            <Sub title="Resend">
              We use Resend to deliver transactional emails such as account confirmations and contact
              form replies. Your email address and relevant message content are transmitted to Resend
              for delivery purposes only.{' '}
              <a href="https://resend.com/legal/privacy-policy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Resend Privacy Policy →
              </a>
            </Sub>
          </Section>

          <Section id="retention" title="5. Data Retention">
            <p>
              We retain your account information and scan history for as long as your account is active.
              If you delete your account, we will permanently delete your personal data and scan history
              within 30 days, except where retention is required by law (e.g. financial records which
              may be retained for up to 7 years).
            </p>
            <p>
              Uploaded document files are not stored after processing is complete. Scan result metadata
              derived from documents is retained as part of your scan history.
            </p>
          </Section>

          <Section id="security" title="6. Data Security">
            <p>
              We implement appropriate technical and organisational measures to protect your information,
              including:
            </p>
            <Ul items={[
              'Encryption in transit using TLS for all data sent between your browser and our servers',
              'Encryption at rest for data stored in Supabase',
              'Row-level security (RLS) policies so each user can only access their own data',
              'API key access controls and short-lived session tokens',
            ]} />
            <p>
              No method of transmission or storage is 100% secure. We encourage you to use a strong,
              unique password and to contact us immediately if you suspect any unauthorised access to
              your account.
            </p>
          </Section>

          <Section id="rights" title="7. Your Rights">
            <p>
              Depending on where you are located, you may have the following rights regarding your
              personal data:
            </p>
            <Sub title="Access">
              You may request a copy of the personal data we hold about you.
            </Sub>
            <Sub title="Correction">
              You may update your account information at any time from your Settings page. You may also
              contact us to correct inaccurate data.
            </Sub>
            <Sub title="Deletion">
              You may delete your account at any time from Settings → Danger Zone. This permanently
              removes your account and associated data.
            </Sub>
            <Sub title="Portability">
              You may request an export of your scan data in a structured, machine-readable format.
            </Sub>
            <Sub title="Objection and restriction">
              You may object to or request restriction of certain processing activities where
              applicable under GDPR or other applicable law.
            </Sub>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${CONTACT}`} className="text-emerald-600 hover:underline">{CONTACT}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section id="children" title="8. Children's Privacy">
            <p>
              Accessly is not directed at children under the age of 16. We do not knowingly collect
              personal information from children. If you believe we have inadvertently collected
              information from a child, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section id="changes" title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make material changes we will
              update the effective date at the top of this page and, where appropriate, notify you by
              email. Your continued use of Accessly after changes are posted constitutes your acceptance
              of the updated policy.
            </p>
          </Section>

          <Section id="contact" title="10. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please
              contact us at:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 not-prose">
              <p className="font-semibold text-slate-900">Accessly</p>
              <p className="mt-1">
                <a href={`mailto:${CONTACT}`} className="text-emerald-600 hover:underline">{CONTACT}</a>
              </p>
            </div>
          </Section>

        </div>
      </div>

      </main>
      <Footer />
    </>
  )
}
