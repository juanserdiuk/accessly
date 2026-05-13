/**
 * Embed slot for the founder's AI explainer video.
 *
 * Drops in your own MP4 (e.g. /accessly-explainer.mp4 in /public) via the
 * NEXT_PUBLIC_EXPERT_VIDEO_URL env var, or supply a poster image via
 * NEXT_PUBLIC_EXPERT_VIDEO_POSTER. If neither is set, a placeholder card
 * renders instead so the section never shows a broken player.
 *
 * No YouTube — uses a native <video> tag for the most "premium feel" and
 * full control over autoplay/preload/captions.
 */
export default function ExpertVideo() {
  const videoUrl = process.env.NEXT_PUBLIC_EXPERT_VIDEO_URL
  const posterUrl = process.env.NEXT_PUBLIC_EXPERT_VIDEO_POSTER

  return (
    <section className="py-20 px-6 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
            See it in action
          </p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">
            Why I built Accessly
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            A 90-second walkthrough of the philosophy, the workflow, and what the platform actually does.
          </p>
        </div>

        <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20">
          {videoUrl ? (
            <video
              controls
              preload="metadata"
              poster={posterUrl ?? undefined}
              className="w-full h-full object-cover"
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
              Sorry, your browser doesn&rsquo;t support embedded videos.
            </video>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(0,212,170,0.18),transparent)] pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto bg-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-400/30">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-slate-900 ml-1">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl text-white mb-2">Founder walkthrough</h3>
                <p className="text-sm text-white/50 max-w-sm">
                  Video coming soon. Set <code className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">NEXT_PUBLIC_EXPERT_VIDEO_URL</code> in Vercel to embed your MP4.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Hosted natively — no YouTube, no third-party trackers.
        </p>
      </div>
    </section>
  )
}
