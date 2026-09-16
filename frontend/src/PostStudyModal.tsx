import {
  X,
  Trophy,
  Clock,
  MessageSquare,
  Mic,
  FileText,
  Sparkles,
  Home,
  Loader2,
} from 'lucide-react'
import { useAuth } from './AuthContext'

interface PostStudyModalProps {
  onClose: () => void
  onBackToDashboard: () => void
  onGenerateSummary: () => void
  generatingSummary?: boolean
  generatedSummary?: string | null
  stats: {
    timeStudied: string
    messages: number
    topicsCount: number
  }
}

export default function PostStudyModal({
  onClose,
  onBackToDashboard,
  onGenerateSummary,
  generatingSummary = false,
  generatedSummary = null,
  stats,
}: PostStudyModalProps) {
  const { user } = useAuth()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-instrument">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0A0915]/55"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-[0_16px_32px_rgba(10,9,21,0.1)] w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-8 flex flex-col items-center gap-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-cream-border/50 flex items-center justify-center hover:bg-cream-border transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-ink-secondary" />
        </button>

        {/* Trophy + confetti */}
        <div className="relative w-24 h-24 flex items-center justify-center mt-2">
          <span className="absolute -left-6 top-4 text-indigo-light text-sm">&#9835;</span>
          <span className="absolute -left-3 bottom-2 text-pink-400 text-[10px]">&#9670;</span>
          <span className="absolute left-2 -top-1 text-green-400 text-[10px]">&#9670;</span>
          <span className="absolute right-2 -top-1 text-indigo-light text-[10px]">&#8226;</span>
          <span className="absolute -right-4 top-6 text-indigo-light text-sm">&#9835;</span>
          <span className="absolute -right-6 bottom-0 text-amber-400 text-[10px]">&#9670;</span>
          <span className="absolute right-0 bottom-0 text-pink-400 text-[10px]">&#8226;</span>

          <div className="w-20 h-20 rounded-full bg-indigo-bg flex items-center justify-center">
            <Trophy className="w-9 h-9 text-indigo" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-ink">Session Complete!</h2>
          <p className="text-ink-secondary text-sm">
            Great work, {user?.name?.split(' ')[0] || 'there'}! Here's what you accomplished.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3 w-full">
          <StatCard
            icon={<Clock className="w-5 h-5 text-indigo-light" />}
            value={stats.timeStudied}
            label="Time Studied"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 text-indigo-light" />}
            value={String(stats.messages)}
            label="Messages"
          />
          <StatCard
            icon={<Mic className="w-5 h-5 text-indigo-light" />}
            value={String(stats.topicsCount)}
            label="Key Topics Discussed"
          />
        </div>

        {/* Generate Summary / Show Summary */}
        <div className="w-full bg-indigo-bg/60 rounded-2xl p-5 flex flex-col gap-3">
          {generatedSummary ? (
            <>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo" />
                <span className="font-bold text-sm text-ink">AI Summary</span>
              </div>
              <p className="text-sm text-indigo-dark leading-relaxed whitespace-pre-wrap">
                {generatedSummary}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-bg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-sm text-ink">
                    Generate AI Summary
                  </span>
                  <span className="text-xs text-ink-secondary leading-relaxed">
                    Get a concise summary of what you covered, including key points,
                    concepts, and next steps.
                  </span>
                </div>
              </div>
              <button
                onClick={onGenerateSummary}
                disabled={generatingSummary || stats.messages === 0}
                className="self-end flex items-center gap-1.5 bg-indigo hover:bg-indigo-dark disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors cursor-pointer"
              >
                {generatingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Summary
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Back to Dashboard */}
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer mt-1"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 py-4 px-3 border border-cream-border rounded-xl">
      <div className="w-9 h-9 rounded-full bg-indigo-bg/70 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-ink">{value}</p>
        <p className="text-xs text-ink-secondary">{label}</p>
      </div>
    </div>
  )
}
