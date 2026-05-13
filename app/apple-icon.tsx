import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Apple touch icon — larger version of the brand favicon.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#34d399',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          fontSize: 128,
          fontWeight: 800,
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.04em',
        }}
      >
        A
      </div>
    ),
    size,
  )
}
