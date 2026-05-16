/**
 * Founder-facing operational notifications. Posts business events
 * (signups, paid subscriptions, scan-pack purchases, cancellations,
 * contact messages, regressions) to a single webhook URL — Slack
 * incoming webhook OR Discord webhook (with the `/slack` suffix).
 *
 * Why one notifier instead of integrating each route with a per-event
 * email / push / etc:
 *   - Solo-founder use case: Juan wants ONE channel that pings his
 *     phone via Slack/Discord mobile app, not five separate channels
 *   - Webhook is push-driven (interrupts) rather than pull-driven
 *     (founder has to remember to check) — that's the whole point
 *   - Slack-format payloads work natively on Discord via the
 *     `<webhook>/slack` URL suffix, so the same code targets either
 *
 * Setup:
 *   1. Create an incoming webhook in Slack (Workspace settings →
 *      Apps → Custom Integrations → Incoming Webhooks → pick a
 *      channel → copy URL)
 *      OR
 *      Discord → Server Settings → Integrations → Webhooks → New →
 *      pick channel → copy URL → APPEND `/slack` to the URL
 *   2. Set OPS_WEBHOOK_URL on Vercel (Production scope)
 *   3. Done — events start flowing on the next deploy
 *
 * If OPS_WEBHOOK_URL is unset, all notify() calls are no-ops. Safe
 * to call from any environment.
 */

const WEBHOOK_TIMEOUT_MS = 3000
const PRODUCT = 'Accessly'

interface SlackField {
  title: string
  value: string
  short?: boolean
}

interface SlackAttachment {
  color?: 'good' | 'warning' | 'danger' | string
  fallback?: string
  fields?: SlackField[]
  text?: string
  footer?: string
  ts?: number
}

interface NotifyPayload {
  /** Lock-screen / mobile preview line. Keep under ~80 chars. */
  text: string
  attachments?: SlackAttachment[]
}

/**
 * Fire-and-forget webhook POST. Aggressively timed out so a slow
 * Slack/Discord endpoint can't compound into a Vercel function
 * timeout. Never throws — the caller doesn't need a try/catch.
 */
async function send(payload: NotifyPayload): Promise<void> {
  const url = process.env.OPS_WEBHOOK_URL
  if (!url) return

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
  } catch (err) {
    // Don't escalate webhook failures — they shouldn't break the
    // request that triggered them.
    console.warn('[notify] webhook failed:', (err as Error)?.message ?? err)
  } finally {
    clearTimeout(timer)
  }
}

function formatCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

// Marketing tier display labels keyed by DB plan slug. Mirrors the
// labels in app/upgrade/UpgradePlans.tsx so notifications match what
// the customer saw at checkout.
function planLabel(dbSlug: string): string {
  return ({
    free:   'Free',
    pps:    'Pay-per-scan',
    pro:    'Pro',
    agency: 'Agency',
  } as Record<string, string>)[dbSlug] ?? dbSlug
}

function packLabel(packSlug: string): string {
  return ({
    starter:       'Starter scan pack (10 pages)',
    basic:         'Basic scan pack (25 pages)',
    'pro-pack':    'Pro scan pack (50 pages)',
    'agency-pack': 'Agency scan pack (100 pages)',
  } as Record<string, string>)[packSlug] ?? packSlug
}

// ---------------------------------------------------------------------------
// Event helpers — each function is one specific business event the founder
// wants to know about. Naming follows the verb form so call sites read
// naturally.
// ---------------------------------------------------------------------------

export const notify = {
  /**
   * A new customer just verified their email and landed on the dashboard.
   * Fires from /auth/callback when isNewUser is detected.
   */
  async signup(args: { email: string; firstName?: string | null }): Promise<void> {
    const who = args.firstName ? `${args.firstName} (${args.email})` : args.email
    return send({
      text: `🆕 New ${PRODUCT} signup — ${who}`,
      attachments: [
        {
          color: 'good',
          fields: [
            { title: 'Email', value: args.email, short: true },
            ...(args.firstName ? [{ title: 'Name', value: args.firstName, short: true }] : []),
          ],
          footer: `${PRODUCT} · signup`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },

  /**
   * The money event. Fires from the Stripe webhook on
   * checkout.session.completed for SUBSCRIPTION purchases.
   */
  async subscriptionStarted(args: {
    customerEmail: string
    plan: string          // DB slug
    amountCents: number
    currency?: string
    sessionId?: string
    promoCode?: string
  }): Promise<void> {
    const tier = planLabel(args.plan)
    const amount = formatCurrency(args.amountCents, args.currency)
    return send({
      text: `💰 ${PRODUCT}: ${tier} subscription — ${amount} from ${args.customerEmail}`,
      attachments: [
        {
          color: 'good',
          fields: [
            { title: 'Customer', value: args.customerEmail,        short: true },
            { title: 'Plan',     value: tier,                       short: true },
            { title: 'Amount',   value: amount,                     short: true },
            ...(args.promoCode ? [{ title: 'Promo',  value: args.promoCode, short: true }] : []),
            ...(args.sessionId
              ? [{ title: 'Stripe session', value: args.sessionId, short: true }]
              : []),
          ],
          footer: `${PRODUCT} · subscription.started`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },

  /**
   * Scan-pack purchase (Accessly-specific — ClearShield doesn't sell
   * these). Fires from the webhook on checkout.session.completed when
   * metadata.type === 'pack'.
   */
  async packPurchased(args: {
    customerEmail: string
    pack: string          // pack slug ('starter' | 'basic' | etc.)
    amountCents: number
    currency?: string
    sessionId?: string
    promoCode?: string
  }): Promise<void> {
    const label = packLabel(args.pack)
    const amount = formatCurrency(args.amountCents, args.currency)
    return send({
      text: `💵 ${PRODUCT}: ${label} — ${amount} from ${args.customerEmail}`,
      attachments: [
        {
          color: 'good',
          fields: [
            { title: 'Customer', value: args.customerEmail, short: true },
            { title: 'Pack',     value: label,               short: true },
            { title: 'Amount',   value: amount,              short: true },
            ...(args.promoCode ? [{ title: 'Promo', value: args.promoCode, short: true }] : []),
            ...(args.sessionId
              ? [{ title: 'Stripe session', value: args.sessionId, short: true }]
              : []),
          ],
          footer: `${PRODUCT} · pack.purchased`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },

  /**
   * Customer cancelled (Stripe customer.subscription.deleted).
   */
  async subscriptionCancelled(args: {
    customerEmail: string
    planWas: string  // DB slug
  }): Promise<void> {
    const tier = planLabel(args.planWas)
    return send({
      text: `🚨 ${PRODUCT}: Subscription cancelled — ${args.customerEmail} (was ${tier})`,
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Customer', value: args.customerEmail, short: true },
            { title: 'Was on',   value: tier,                short: true },
          ],
          footer: `${PRODUCT} · subscription.cancelled`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },

  /**
   * Inbound contact form submission.
   */
  async contactMessage(args: {
    name: string
    email: string
    reason?: string
    website?: string
    messagePreview: string
  }): Promise<void> {
    const reasonTag = args.reason ? `[${args.reason.toUpperCase()}]` : ''
    const preview = args.messagePreview.length > 120
      ? args.messagePreview.slice(0, 117) + '...'
      : args.messagePreview
    return send({
      text: `📬 ${PRODUCT} contact ${reasonTag} from ${args.name} — "${preview}"`,
      attachments: [
        {
          color: '#34d399',  // emerald — Accessly brand
          fields: [
            { title: 'Name',    value: args.name,  short: true },
            { title: 'Email',   value: args.email, short: true },
            ...(args.website ? [{ title: 'Website', value: args.website, short: true }] : []),
            ...(args.reason  ? [{ title: 'Reason',  value: args.reason,  short: true }] : []),
            { title: 'Message', value: preview,    short: false },
          ],
          footer: `${PRODUCT} · contact.message`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },

  /**
   * A scheduled scan caught a meaningful regression. Tells the founder
   * so they have product-side visibility into customer pain.
   */
  async scanRegression(args: {
    customerEmail: string
    url: string
    previousScore: number
    currentScore: number
  }): Promise<void> {
    const drop = args.previousScore - args.currentScore
    return send({
      text: `⚠ ${PRODUCT} regression: ${args.url} dropped ${drop} pts (now ${args.currentScore}/100) — ${args.customerEmail}`,
      attachments: [
        {
          color: 'warning',
          fields: [
            { title: 'Customer', value: args.customerEmail,         short: true },
            { title: 'URL',      value: args.url,                    short: true },
            { title: 'Previous', value: `${args.previousScore}/100`, short: true },
            { title: 'Current',  value: `${args.currentScore}/100`,  short: true },
            { title: 'Δ',        value: `−${drop}`,                  short: true },
          ],
          footer: `${PRODUCT} · scan.regression`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },

  /**
   * Generic plain-text fallback. Useful for one-off events.
   */
  async raw(text: string, color: 'good' | 'warning' | 'danger' | string = '#94a3b8'): Promise<void> {
    return send({
      text,
      attachments: [
        {
          color,
          footer: `${PRODUCT} · ops`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  },
}
