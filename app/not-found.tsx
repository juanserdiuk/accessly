import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-serif text-7xl text-slate-900 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">{t('notFoundTitle')}</h1>
        <p className="text-slate-500 mb-8">{t('notFoundSub')}</p>
        <Link
          href="/"
          className="inline-block bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm"
        >
          {t('notFoundCta')}
        </Link>
      </div>
    </main>
  )
}
