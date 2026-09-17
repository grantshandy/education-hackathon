import {
  BookOpen,
  PlayCircle,
  ArrowRight,
  Clock,
  Calendar,
  Flame,
  GraduationCap,
} from 'lucide-react'

const RECENT_SESSIONS = [
  {
    title: 'Algorithms Study Session',
    time: '42 min',
    date: 'Yesterday',
    tags: ['Graphs', 'BFS', 'Dijkstra'],
  },
  {
    title: 'Organic Chemistry Review',
    time: '28 min',
    date: '2 days ago',
    tags: ['Reactions', 'Nomenclature'],
  },
  {
    title: 'Linear Algebra Practice',
    time: '55 min',
    date: '3 days ago',
    tags: ['Eigenvalues', 'Matrices'],
  },
]

const STATS = [
  { icon: Clock, label: 'Study Time This Week', value: '3h 24m' },
  { icon: Calendar, label: 'Study Sessions', value: '7 sessions' },
  { icon: Flame, label: 'Current Streak', value: '5 days' },
]

export default function HomePage({
  onStart,
  onDebugSession,
}: {
  onStart: () => void
  onDebugSession?: () => void
}) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-geist">
      {/* Navigation */}
      <nav className="h-20 px-[120px] flex items-center justify-between border-b border-cream-border-dark shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-[15px] font-semibold text-indigo-light cursor-pointer">
            Home
          </span>
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Study Sessions
          </span>
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Settings
          </span>
          <div className="w-10 h-10 rounded-full bg-indigo-bg border-2 border-indigo-light" />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-20 py-20 flex items-center gap-16">
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="font-gabarito font-extrabold text-[56px] leading-[1.1] text-ink">
              Ready to study?
            </h1>
            <p className="text-xl text-ink-secondary leading-relaxed">
              Study with an AI classmate that understands your course material —
              upload PDFs, lecture slides, and notes instantly.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onStart}
              className="flex items-center gap-2.5 bg-indigo-light hover:bg-indigo px-8 py-4 rounded-xl w-fit text-white font-bold text-base transition-colors cursor-pointer shadow-[0_8px_16px_rgba(192,106,69,0.25)]"
            >
              <PlayCircle className="w-5 h-5" />
              Start Study Session
            </button>
            {onDebugSession && (
              <button
                onClick={onDebugSession}
                className="flex items-center gap-2 px-6 py-4 rounded-xl border border-dashed border-ink-muted text-ink-muted text-sm font-medium hover:border-ink-secondary hover:text-ink-secondary transition-colors cursor-pointer"
              >
                Skip to Session (Dev)
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-card p-4 rounded-3xl border border-card-border shadow-[0_12px_24px_rgba(192,106,69,0.07)]">
          <img
            src="/lofi-hero.png"
            alt="Lo-fi study illustration"
            className="w-full h-80 object-cover rounded-2xl"
          />
          <div className="flex items-center gap-3 px-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-indigo-light" />
            <p className="text-[13px] text-ink-secondary">
              During a session, your AI classmate turns toward you and responds
              with synchronized speech.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Sessions */}
      <section className="px-20 pb-20 flex flex-col gap-6">
        <h2 className="font-gabarito font-bold text-[28px] text-ink">
          Recent Sessions
        </h2>
        <div className="flex gap-6">
          {RECENT_SESSIONS.map((session) => (
            <div
              key={session.title}
              className="flex-1 bg-card border border-card-border rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-[0_4px_12px_rgba(192,106,69,0.07)]"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-[10px] bg-indigo-bg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-light" />
                  </div>
                  <span className="text-xs font-medium text-ink-muted">
                    {session.time} · {session.date}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-gabarito font-semibold text-xl text-ink">
                    {session.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-cream-200 text-ink-secondary text-xs font-medium px-2.5 py-1 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 h-10 bg-cream-100 border border-cream-border rounded-lg text-sm font-semibold text-ink-secondary hover:text-ink hover:border-ink-muted transition-colors cursor-pointer">
                View Summary
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="px-20 pb-24 flex flex-col gap-6">
        <h2 className="font-gabarito font-bold text-2xl text-ink">
          Quick Stats
        </h2>
        <div className="flex gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-card border border-card-border rounded-2xl h-[100px] px-6 flex items-center gap-4 shadow-[0_4px_12px_rgba(192,106,69,0.07)]"
            >
              <div className="w-12 h-12 rounded-3xl bg-indigo-bg flex items-center justify-center shrink-0">
                <stat.icon className="w-[22px] h-[22px] text-indigo-light" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="font-gabarito font-bold text-2xl text-ink">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="h-20 px-20 flex items-center justify-between border-t border-cream-border mt-auto">
        <span className="text-sm text-ink-muted">
          © 2025 StudyMate AI. Built for mindful learning.
        </span>
        <div className="flex gap-4">
          <span className="text-sm text-ink-muted hover:text-ink-secondary cursor-pointer transition-colors">
            Privacy Policy
          </span>
          <span className="text-sm text-ink-muted hover:text-ink-secondary cursor-pointer transition-colors">
            Terms of Service
          </span>
        </div>
      </footer>
    </div>
  )
}
