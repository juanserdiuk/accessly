// Plain module — NOT 'use server'. Constants that both the server action
// and the server component page need to share. Next.js disallows exporting
// non-function values from 'use server' files.

export type Cadence = 'hourly' | 'every_6h' | 'daily' | 'weekly'

export const CADENCE_LABELS: Record<Cadence, string> = {
  hourly: 'every hour',
  every_6h: 'every 6 hours',
  daily: 'daily',
  weekly: 'weekly',
}

export const CADENCE_MS: Record<Cadence, number> = {
  hourly:   60 * 60 * 1000,
  every_6h: 6 * 60 * 60 * 1000,
  daily:    24 * 60 * 60 * 1000,
  weekly:   7 * 24 * 60 * 60 * 1000,
}

export function isValidCadence(c: string): c is Cadence {
  return c === 'hourly' || c === 'every_6h' || c === 'daily' || c === 'weekly'
}
