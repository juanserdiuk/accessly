'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: '#64748b', marginBottom: 32 }}>An unexpected error occurred. We've been notified.</p>
            <button
              onClick={reset}
              style={{ background: '#0f172a', color: '#fff', fontWeight: 600, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
