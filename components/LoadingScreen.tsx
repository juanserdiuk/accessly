/**
 * Full-viewport loading screen with the Accessly logo.
 * Used as a Suspense fallback (app/loading.tsx etc.) to give pages a
 * branded transition while their server data loads.
 */
export default function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="min-h-screen flex items-center justify-center bg-slate-50"
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo with a pulsing emerald glow */}
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-2xl animate-pulse"
          />
          <div className="relative w-14 h-14 bg-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/30">
            <span className="font-serif text-2xl font-extrabold text-slate-900 leading-none">A</span>
          </div>
        </div>

        {/* Accessly wordmark */}
        <span className="font-serif text-lg text-slate-900">Accessly</span>

        {/* Animated bar */}
        <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
          <span className="block h-full w-1/2 bg-emerald-400 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
