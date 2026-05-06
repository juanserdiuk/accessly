interface Props {
  favicon: string
  faviconBg: string
  faviconColor: string
  name: string
  meta: string
  score: number
}

export default function SiteRow({ favicon, faviconBg, faviconColor, name, meta, score }: Props) {
  const scoreColor = score >= 80 ? 'bg-green-50 text-green-600' : score >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
  const dotColor = score >= 80 ? 'bg-green-500' : score >= 70 ? 'bg-amber-400' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${faviconBg} ${faviconColor}`}>
        {favicon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
        <div className="text-xs text-slate-400">{meta}</div>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor}`}>{score}</span>
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
    </div>
  )
}