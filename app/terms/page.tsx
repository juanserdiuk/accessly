import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

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

export default function TermsPage() {
  return (
    <main>
      <Nav />

      {/* Hero */}
      <div className="bg-slate-900 px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,212,170,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">Terms of Service</h1>
          <p className="text-white/50 text-sm">Effective date: {EFFECTIVE}</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white px-6 py-16">
        <div className="max-w-3xl mx-auto">

          {/* Intro */}
          <p className="text-slate-600 leading-7 mb-12">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Accessly platform
            (&ldquo;Service&rdquo;) operated by Accessly (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By creating an account or
            using the Service you agree to be bound by these Terms. If you are using the Service on
            behalf of an organisation, you represent that you have authority to bind that organisation
            to these Terms.
          </p>

          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By accessing or using Accessly you confirm that you are at least 16 years of age, that
              you have read and understood these Terms, and that you agree to be bound by them. If you
              do not agree, you must not use the Service.
            </p>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by
              email or by posting a notice in the Service. Continued use after the effective date of
              updated Terms constitutes acceptance.
            </p>
          </Section>

          <Section id="description" title="2. Description of Service">
            <p>
              Accessly is a web accessibility scanning platform that enables users to:
            </p>
            <Ul items={[
              'Scan public URLs for WCAG 2.2 accessibility violations using automated testing',
              'Upload PDF and Word documents for accessibility checks',
              'Monitor saved websites and track compliance over time',
              'View detailed reports and remediation guidance',
              'Access scan history and compliance trends via a dashboard',
              'Access the platform programmatically via our REST API (paid plans)',
            ]} />
            <p>
              Accessly&rsquo;s automated scanning identifies a subset of accessibility issues. It does not
              guarantee full WCAG compliance and is not a substitute for manual expert review.
            </p>
          </Section>

          <Section id="accounts" title="3. Account Registration">
            <Sub title="Eligibility">
              You must provide accurate, complete, and current information when creating an account.
              You are responsible for maintaining the confidentiality of your credentials and for all
              activity that occurs under your account.
            </Sub>
            <Sub title="One account per person">
              Each account is for a single user. Sharing login credentials with others is not permitted
              on individual plans. Team plans are available for multi-user access.
            </Sub>
            <Sub title="Account security">
              You must notify us immediately at{' '}
              <a href={`mailto:${CONTACT}`} className="text-emerald-600 hover:underline">{CONTACT}</a>{' '}
              if you suspect any unauthorised access to your account. We are not liable for losses
              resulting from unauthorised use of your credentials.
            </Sub>
          </Section>

          <Section id="billing" title="4. Subscription and Billing">
            <Sub title="Free tier">
              Accessly offers a free tier that allows a limited number of scans per month. Free tier
              features and limits may change at our discretion with reasonable notice.
            </Sub>
            <Sub title="Paid plans">
              Paid subscriptions unlock higher scan volumes, monitoring features, API access, and
              detailed reporting. Plan details and pricing are listed on our Pricing page and are
              subject to change.
            </Sub>
            <Sub title="Billing cycle">
              Paid subscriptions are billed monthly or annually in advance, depending on the plan you
              select. Your subscription renews automatically at the end of each billing period unless
              cancelled.
            </Sub>
            <Sub title="Payment processing">
              All payments are processed by Stripe. By providing payment information you authorise us
              to charge the applicable fees to your chosen payment method. You must keep your payment
              information current to avoid interruption of service.
            </Sub>
            <Sub title="Price changes">
              We may change subscription prices with at least 30 days&rsquo; notice. If you do not agree
              to a price change, you may cancel before the new price takes effect.
            </Sub>
            <Sub title="Taxes">
              Prices do not include applicable taxes. You are responsible for any sales tax, VAT, or
              similar tax imposed by your jurisdiction.
            </Sub>
          </Section>

          <Section id="refunds" title="5. Refund Policy">
            <p>
              We offer the following refund policy for paid subscriptions:
            </p>
            <Sub title="Monthly plans">
              Monthly subscriptions may be cancelled at any time. Cancellation takes effect at the end
              of the current billing period. We do not offer prorated refunds for the unused portion of
              a monthly billing period.
            </Sub>
            <Sub title="Annual plans">
              If you cancel an annual plan within 14 days of the initial purchase or renewal and have
              made no more than 10 scans during that period, you may request a full refund. After 14
              days, annual plan fees are non-refundable except where required by law.
            </Sub>
            <Sub title="How to request a refund">
              To request a refund, email us at{' '}
              <a href={`mailto:${CONTACT}`} className="text-emerald-600 hover:underline">{CONTACT}</a>{' '}
              with your account email and a brief explanation. We will process eligible refunds within
              10 business days.
            </Sub>
            <Sub title="Exceptions">
              We reserve the right to refuse refunds in cases of Terms violations, fraudulent activity,
              or abuse of the refund policy.
            </Sub>
          </Section>

          <Section id="acceptable-use" title="6. Acceptable Use">
            <p>You agree not to use Accessly to:</p>
            <Ul items={[
              'Scan URLs or upload documents without authorisation from the content owner',
              'Attempt to circumvent rate limits, scan limits, or other service restrictions',
              'Reverse engineer, decompile, or attempt to extract the source code of the Service',
              'Use the Service to transmit malware, spam, or any harmful content',
              'Resell, sublicense, or commercially redistribute the Service without our written consent',
              'Interfere with or disrupt the integrity or performance of the Service or its infrastructure',
              'Use the API in a manner that exceeds reasonable usage or places undue burden on our systems',
              'Violate any applicable law or regulation',
            ]} />
            <p>
              We reserve the right to suspend or terminate accounts that violate these requirements
              without prior notice.
            </p>
          </Section>

          <Section id="ip" title="7. Intellectual Property">
            <Sub title="Our property">
              Accessly and all its underlying technology, software, trademarks, logos, and content are
              the exclusive property of Accessly. Nothing in these Terms grants you ownership of or
              licence to our intellectual property beyond the limited right to use the Service.
            </Sub>
            <Sub title="Your content">
              You retain ownership of any URLs, documents, or content you submit to the Service. By
              using the Service you grant us a limited, non-exclusive licence to process your content
              solely for the purpose of providing the Service to you.
            </Sub>
            <Sub title="Feedback">
              If you provide us with feedback or suggestions about the Service, you grant us the right
              to use that feedback without restriction or compensation.
            </Sub>
          </Section>

          <Section id="disclaimers" title="8. Disclaimer of Warranties">
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, error-free, or free of harmful
              components. Accessibility scan results are produced by automated tools and may not
              identify all accessibility issues. Accessly does not guarantee that following our
              recommendations will achieve full legal compliance.
            </p>
          </Section>

          <Section id="liability" title="9. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ACCESSLY, ITS
              OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, GOODWILL,
              OR BUSINESS INTERRUPTION — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE,
              EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE
              TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US IN THE
              12 MONTHS PRECEDING THE CLAIM, OR (B) USD $100.
            </p>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages. In such
              jurisdictions our liability is limited to the maximum extent permitted by law.
            </p>
          </Section>

          <Section id="indemnification" title="10. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Accessly and its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and
              expenses (including reasonable legal fees) arising out of or in any way connected with:
            </p>
            <Ul items={[
              'Your use of or inability to use the Service',
              'Your violation of these Terms',
              'Your violation of any third-party right, including intellectual property or privacy rights',
              'Any content you submit to the Service',
            ]} />
          </Section>

          <Section id="termination" title="11. Termination">
            <Sub title="By you">
              You may cancel your account at any time from Settings → Danger Zone. Cancellation ends
              your access to paid features at the end of your current billing period.
            </Sub>
            <Sub title="By us">
              We may suspend or terminate your account immediately if you violate these Terms, engage
              in fraudulent activity, or if required by law. We will provide notice where reasonably
              practicable.
            </Sub>
            <Sub title="Effect of termination">
              Upon termination, your right to use the Service ceases immediately. Provisions that by
              their nature should survive termination (including IP ownership, disclaimers, liability
              limits, and indemnification) will continue to apply.
            </Sub>
          </Section>

          <Section id="governing-law" title="12. Governing Law and Disputes">
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any dispute
              arising from these Terms or your use of the Service shall first be attempted to be
              resolved informally by contacting us at{' '}
              <a href={`mailto:${CONTACT}`} className="text-emerald-600 hover:underline">{CONTACT}</a>.
            </p>
            <p>
              If informal resolution fails, disputes shall be submitted to binding arbitration or
              the courts of competent jurisdiction, as required by applicable law in your location.
              You waive any right to participate in a class-action lawsuit or class-wide arbitration.
            </p>
          </Section>

          <Section id="general" title="13. General Provisions">
            <Sub title="Entire agreement">
              These Terms, together with our Privacy Policy, constitute the entire agreement between
              you and Accessly regarding your use of the Service and supersede all prior agreements.
            </Sub>
            <Sub title="Severability">
              If any provision of these Terms is found to be unenforceable, that provision will be
              modified to the minimum extent necessary to make it enforceable, and the remaining
              provisions will continue in full force.
            </Sub>
            <Sub title="No waiver">
              Our failure to enforce any right or provision of these Terms shall not be deemed a waiver
              of that right or provision.
            </Sub>
            <Sub title="Assignment">
              You may not assign or transfer any rights under these Terms without our prior written
              consent. We may assign our rights without restriction.
            </Sub>
          </Section>

          <Section id="contact" title="14. Contact Us">
            <p>
              Questions about these Terms? Contact us at:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="font-semibold text-slate-900">Accessly</p>
              <p className="mt-1">
                <a href={`mailto:${CONTACT}`} className="text-emerald-600 hover:underline">{CONTACT}</a>
              </p>
            </div>
          </Section>

        </div>
      </div>

      <Footer />
    </main>
  )
}
