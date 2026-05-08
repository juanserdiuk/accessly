'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { deleteAccount } from './actions'

export default function DangerZone() {
  const t = useTranslations('dashboard.settings')
  const [expanded, setExpanded] = useState(false)
  const [state, action, pending] = useActionState(deleteAccount, null)

  const confirmParts = t('deleteConfirmLabel', { word: '__WORD__' }).split('__WORD__')

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {t('dangerLead')}
      </p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg
            hover:bg-red-50 transition"
        >
          {t('deleteAccount')}
        </button>
      ) : (
        <div className="border border-red-200 rounded-xl p-4 space-y-3 bg-red-50/40">
          <p className="text-sm font-medium text-red-700">
            {t('deleteWarning')}
          </p>
          <form action={action} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-red-700">
                {confirmParts[0]}<span className="font-mono font-bold">DELETE</span>{confirmParts[1]}
              </label>
              <input
                name="confirm"
                autoComplete="off"
                placeholder="DELETE"
                className="w-full max-w-xs px-3 py-2.5 text-sm border border-red-200 rounded-xl bg-white
                  focus:outline-none focus:border-red-400 transition placeholder:text-red-200"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg
                  hover:bg-red-700 transition disabled:opacity-50"
              >
                {pending ? t('deleting') : t('deleteSubmit')}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
