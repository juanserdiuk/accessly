'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { addSite } from './actions'

export default function AddSiteForm() {
  const t = useTranslations('dashboard.monitor')
  const tCommon = useTranslations('dashboard.common')
  const [state, action, pending] = useActionState(addSite, null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear the input after a successful add
  useEffect(() => {
    if (state?.success && inputRef.current) {
      inputRef.current.value = ''
    }
  }, [state])

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-3">
        <input
          ref={inputRef}
          name="url"
          type="url"
          placeholder={tCommon('scanPlaceholder')}
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
            focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl
            hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
        >
          {pending ? t('adding') : t('addSubmit')}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
    </form>
  )
}
