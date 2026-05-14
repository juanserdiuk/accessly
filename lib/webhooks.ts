/**
 * Best-effort outbound webhook delivery for scan-complete events.
 *
 * Used by /api/scan (dashboard) and /api/v1/scan (CI/CD) to notify each
 * customer's configured `user_metadata.webhook_url` of a freshly completed
 * scan. Fired in fire-and-forget fashion — webhook failures must never
 * affect the user-facing scan response.
 */

import { createHmac } from 'crypto'

interface ScanWebhookPayload {
  event: 'scan.completed'
  url: string
  score: number
  errors: number
  warnings: number
  passes: number
  /** Stable ISO 8601 timestamp. */
  scannedAt: string
  /** Stable id from the scans table when available (omitted for anonymous /api/v1 calls). */
  scanId?: string
  /** Browser URL for the public report — handy in Slack-style notifications. */
  reportUrl?: string
}

function isAllowedHttps(raw: string): URL | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return u
  } catch {
    return null
  }
}

export async function sendScanWebhook(
  webhookUrl: string | null | undefined,
  payload: ScanWebhookPayload,
): Promise<void> {
  if (!webhookUrl) return
  const target = isAllowedHttps(webhookUrl)
  if (!target) return

  const body = JSON.stringify(payload)
  // Optional HMAC signature so receivers can verify the call came from us.
  // Customers set WEBHOOK_SIGNING_SECRET on their end and on Vercel's side too.
  const secret = process.env.WEBHOOK_SIGNING_SECRET
  const signature = secret
    ? createHmac('sha256', secret).update(body).digest('hex')
    : null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Accessly-Webhooks/1.0',
      'X-Accessly-Event': payload.event,
    }
    if (signature) headers['X-Accessly-Signature'] = `sha256=${signature}`

    await fetch(target.toString(), {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    }).catch(err => {
      console.warn('[webhooks] delivery failed:', err?.message ?? err)
    })

    clearTimeout(timeout)
  } catch (err) {
    console.warn('[webhooks] threw:', (err as Error)?.message ?? err)
  }
}
