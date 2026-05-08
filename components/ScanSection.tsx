import Scanner from './Scanner'
import DocScanner from './DocScanner'
import ContactPanel from './ContactPanel'

export default function ScanSection() {
  return (
    <section id="scanner" className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Try it free</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-4">
            Three ways to improve accessibility
          </h2>
          <p className="text-slate-500">
            Scan a URL, upload a document, or talk to our team — start in seconds, no account needed.
          </p>
        </div>

        {/* Stacked panels */}
        <div className="max-w-3xl mx-auto space-y-8">
          <Scanner />
          <DocScanner />
          <ContactPanel />
        </div>

      </div>
    </section>
  )
}
