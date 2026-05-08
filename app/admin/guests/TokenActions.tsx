'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs font-medium text-slate-500 hover:text-slate-800 transition whitespace-nowrap"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}

export function RevokeButton({ id }: { id: string }) {
  const [revoking, setRevoking] = useState(false)
  const router = useRouter()

  async function revoke() {
    if (!confirm('Revoke this guest link? It will stop working immediately.')) return
    setRevoking(true)
    try {
      await fetch('/api/guest/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      router.refresh()
    } finally {
      setRevoking(false)
    }
  }

  return (
    <button
      onClick={revoke}
      disabled={revoking}
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-300
        hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
      title="Revoke"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  )
}
