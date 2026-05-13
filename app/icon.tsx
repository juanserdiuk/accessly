import { ImageResponse } from 'next/og'

// Route segment config
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Dynamic favicon: emerald rounded square with a serif "A"
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#34d399',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          fontSize: 22,
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
