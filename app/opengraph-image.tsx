import { ImageResponse } from 'next/og'

// Route segment config — Next.js convention auto-serves this as the
// canonical Open Graph + Twitter card image for the entire site. The
// previous layout.tsx referenced /og-image.png which didn't exist, so
// every social share was returning a broken preview.
export const alt = 'Accessly — WCAG 2.2 Accessibility Scanner'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Top — branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: '#34d399',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontSize: 38,
              fontWeight: 800,
              fontFamily: 'Georgia, serif',
              letterSpacing: '-0.04em',
            }}
          >
            A
          </div>
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 36,
              fontWeight: 700,
              color: 'white',
            }}
          >
            Accessly
          </span>
        </div>

        {/* Middle — headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'white',
              display: 'flex',
            }}
          >
            Make every website
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#34d399',
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            accessible.
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 16,
              maxWidth: 900,
              display: 'flex',
            }}
          >
            WCAG 2.2 AA + AAA scans in 12 seconds. Actionable reports, real code fixes.
          </div>
        </div>

        {/* Bottom — trust strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, color: 'rgba(255,255,255,0.45)' }}>
          <span>WCAG 2.2 AA + AAA</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
          <span>Free to start</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
          <span>accessly.us</span>
        </div>
      </div>
    ),
    size,
  )
}
