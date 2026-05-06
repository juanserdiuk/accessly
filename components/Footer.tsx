import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-900 px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-white">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 text-xs font-bold">A</span>
          </div>
          Accessly
        </Link>
        <div className="flex gap-6">
          {['Features','Pricing','Privacy','Terms'].map(item => (
            <Link key={item} href="#" className="text-sm text-white/40 hover:text-white/80 transition">{item}</Link>
          ))}
        </div>
        <p className="text-sm text-white/30">© 2026 Accessly. All rights reserved.</p>
      </div>
    </footer>
  )
}