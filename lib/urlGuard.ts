/**
 * URL safety guard for the scan endpoints.
 *
 * Risk model:
 *   - `/api/scan` and `/api/v1/scan` accept an arbitrary URL and pass it
 *     to Browserless, which then loads it in a real browser. Most of the
 *     usual SSRF blast radius (probing our own internal network) doesn't
 *     apply because the navigation happens on Browserless's
 *     infrastructure, not ours. But:
 *       a) we don't want to let attackers use our paid Browserless minutes
 *          to scan THEIR own attack infrastructure or cloud metadata
 *          endpoints,
 *       b) scanning loopback / private IPs returns useless results anyway —
 *          a polite 400 with a clear message is a better UX than a confused
 *          puppeteer timeout, and
 *       c) defense in depth is cheap.
 *
 * What we block:
 *   - non-http(s) protocols (file:, javascript:, ftp:, gopher:, …)
 *   - loopback hostnames (localhost, 127.x, 0.0.0.0, ::1)
 *   - link-local (169.254.x — AWS / GCP metadata, IPv6 fe80::/10)
 *   - RFC1918 private ranges (10.x, 172.16-31.x, 192.168.x)
 *   - IPv4-mapped IPv6 of the above (::ffff:127.0.0.1, etc.)
 *   - .local / .internal / .lan / .arpa suffixes
 *
 * What we DON'T do:
 *   - DNS resolution. An attacker who controls a domain can still point it
 *     to a private IP and bypass this string check. The real defense for
 *     that is Browserless's network isolation; we accept the residual risk
 *     in exchange for not eating a DNS round-trip on every scan.
 */

const BLOCKED_PROTOCOLS = new Set([
  'file:',
  'javascript:',
  'data:',
  'vbscript:',
  'ftp:',
  'gopher:',
  'jar:',
  'view-source:',
])

const BLOCKED_HOSTS = new Set([
  'localhost',
  '0.0.0.0',
  '::',
  '::1',
])

const BLOCKED_SUFFIXES = ['.local', '.internal', '.lan', '.arpa']

function isPrivateIPv4(host: string): boolean {
  const parts = host.split('.')
  if (parts.length !== 4) return false
  const nums = parts.map(p => parseInt(p, 10))
  if (nums.some(n => Number.isNaN(n) || n < 0 || n > 255)) return false

  if (nums[0] === 127) return true
  if (nums[0] === 10) return true
  if (nums[0] === 192 && nums[1] === 168) return true
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true
  if (nums[0] === 169 && nums[1] === 254) return true
  if (nums[0] === 0) return true
  if (nums[0] === 100 && nums[1] >= 64 && nums[1] <= 127) return true
  return false
}

function isPrivateIPv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === '::1' || h === '::') return true
  if (h.startsWith('fe8') || h.startsWith('fe9') || h.startsWith('fea') || h.startsWith('feb')) {
    return true
  }
  if (h.startsWith('fc') || h.startsWith('fd')) return true
  const mapped = h.match(/^::ffff:([\d.]+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  return false
}

export interface UrlGuardResult {
  ok: boolean
  url?: string
  reason?: string
}

/**
 * Validate that a user-supplied URL is safe to pass to the scanner.
 * Returns either a normalised absolute URL or a `reason` string suitable
 * for showing to the caller.
 */
export function safeScanUrl(input: string): UrlGuardResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, reason: 'URL is required' }

  const withProto = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(withProto)
  } catch {
    return { ok: false, reason: 'Not a valid URL' }
  }

  if (BLOCKED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: `Protocol ${parsed.protocol} is not allowed` }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) URLs can be scanned' }
  }

  const host = parsed.hostname.toLowerCase()

  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, reason: `Cannot scan ${host} — internal addresses are not allowed` }
  }
  if (BLOCKED_SUFFIXES.some(suffix => host.endsWith(suffix))) {
    return { ok: false, reason: `Cannot scan ${host} — internal-network hostnames are not allowed` }
  }
  if (isPrivateIPv4(host)) {
    return { ok: false, reason: `Cannot scan ${host} — private/internal IP addresses are not allowed` }
  }
  if (host.includes(':') && isPrivateIPv6(host)) {
    return { ok: false, reason: `Cannot scan ${host} — private/internal IPv6 addresses are not allowed` }
  }

  return { ok: true, url: parsed.toString() }
}
