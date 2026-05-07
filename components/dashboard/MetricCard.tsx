import { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  trendNeutral?: boolean
  icon: ReactNode
  iconBg: string
}

export default function MetricCard({ label, value, trend, trendUp, trendNeutral, icon, iconBg }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trendNeutral ? 'bg-slate-100 text-slate-500' :
            trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className="font-serif text-3xl text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</div>
    </div>
  )
}
