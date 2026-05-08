import { getTranslations } from 'next-intl/server'
import Scanner from './Scanner'
import DocScanner from './DocScanner'
import ContactPanel from './ContactPanel'

export default async function ScanSection() {
  const t = await getTranslations('scanSection')

  return (
    <section id="scanner" className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">

        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">{t('label')}</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-4">{t('headline')}</h2>
          <p className="text-slate-500">{t('sub')}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <Scanner />
          <DocScanner />
          <ContactPanel />
        </div>

      </div>
    </section>
  )
}
