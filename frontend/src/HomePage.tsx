import {
  PlayCircle,
  GraduationCap,
  Headphones,
  Upload,
  MessageCircle,
  FileText,
} from 'lucide-react'
import { useAuth } from './AuthContext'
const VIDEO_URL = '/sprites/lofi-girl-loop.gif'

const STEPS = [
  {
    icon: Upload,
    title: 'Upload Your Materials',
    description: 'Drop in your lecture slides, PDFs, and notes. Your study buddy reads them so it can answer based on what your class actually covers.',
  },
  {
    icon: MessageCircle,
    title: 'Study Together',
    description: 'Ask questions by voice or text — like talking to a classmate who already understands the material and can explain it simply.',
  },
  {
    icon: FileText,
    title: 'Get a Recap',
    description: 'When you\'re done, get a summary of topics covered, key concepts, and how long you studied. Pick up right where you left off next time.',
  },
]

export default function HomePage({
  onStart,
  onStudySessions,
  onSettings,
  onDebugSession,
}: {
  onStart: () => void
  onStudySessions?: () => void
  onSettings?: () => void
  onDebugSession?: () => void
}) {
  const { user } = useAuth()
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
          <span onClick={onStudySessions} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Dashboard
          </span>
          <span onClick={onSettings} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Settings
          </span>
          <div className="w-10 h-10 rounded-full bg-indigo-bg border-2 border-indigo-light flex items-center justify-center">
            <span className="text-sm font-bold text-indigo">
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section — video background */}
      <section className="relative h-[520px] overflow-hidden">
        <img
          src={VIDEO_URL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(30,20,12,0.85)] via-[rgba(30,20,12,0.6)] to-[rgba(30,20,12,0.3)]" />

        <div className="relative z-10 h-full flex flex-col justify-center px-20 max-w-2xl gap-6">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-light" />
            <span className="text-sm font-medium text-white/70 tracking-wide uppercase">Lo-fi Study Companion</span>
          </div>
          <h1 className="font-gabarito font-extrabold text-[56px] leading-[1.05] text-white">
            Study with a friend who gets it.
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Upload your course materials and study alongside an AI classmate who already
            understands your lectures — ask questions with your voice, just like talking to a real study partner.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={onStart}
              className="flex items-center gap-2.5 bg-indigo-light hover:bg-indigo px-8 py-4 rounded-xl text-white font-bold text-base transition-colors cursor-pointer shadow-[0_8px_24px_rgba(212,137,106,0.4)]"
            >
              <PlayCircle className="w-5 h-5" />
              Start Studying
            </button>
            {onDebugSession && (
              <button
                onClick={onDebugSession}
                className="flex items-center gap-2 px-6 py-4 rounded-xl border border-dashed border-white/30 text-white/50 text-sm font-medium hover:border-white/50 hover:text-white/70 transition-colors cursor-pointer"
              >
                Skip to Session (Dev)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-20 pt-16 pb-24 flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3">
          <h2 className="font-gabarito font-bold text-[32px] text-ink text-center">
            How it works
          </h2>
          <p className="text-base text-ink-secondary text-center max-w-lg">
            Three steps to a better study session — no sign-up quiz, no complicated setup.
          </p>
        </div>
        <div className="flex gap-8 w-full">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex-1 bg-card border border-card-border rounded-2xl p-8 flex flex-col gap-5 shadow-[0_4px_12px_rgba(192,106,69,0.07)]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-bg flex items-center justify-center shrink-0">
                  <step.icon className="w-6 h-6 text-indigo" />
                </div>
                <span className="text-sm font-bold text-indigo-light">Step {i + 1}</span>
              </div>
              <h3 className="font-gabarito font-bold text-xl text-ink">{step.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{step.description}</p>
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
