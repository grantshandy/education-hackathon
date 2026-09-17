import { useState, useEffect } from 'react'
import {
  GraduationCap,
  ArrowLeft,
  Pencil,
  Play,
  Clock,
  FileText,
  BarChart3,
  Flame,
  ChevronDown,
  ChevronRight,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { api, type Course, type Session } from './api'
import { getColorSet, DEFAULT_ICON, ICON_MAP } from './courseStyles'
import StartSessionModal from './StartSessionModal'

interface SessionDocument {
  fileName: string
  contentType: string
  uploadedAt: string
  sessionTitle: string
}

type SortMode = 'recent' | 'longest' | 'shortest'

export default function CoursePage({
  courseId,
  onBack,
  onStartSession,
  onHome,
  onSettings,
}: {
  courseId: string
  onBack: () => void
  onStartSession: (sessionId: string) => void
  onHome?: () => void
  onSettings?: () => void
}) {
  const { getIdToken } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [viewingSession, setViewingSession] = useState<Session | null>(null)
  const [documents, setDocuments] = useState<SessionDocument[]>([])
  const [showStartModal, setShowStartModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [courseId, getIdToken])

  async function loadData() {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        api.listCourses(getIdToken),
        api.listSessions(getIdToken, courseId),
      ])
      const found = coursesRes.courses.find((c) => c.courseId === courseId)
      if (found) setCourse(found)
      setSessions(sessionsRes.sessions)

      const allDocs: SessionDocument[] = []
      for (const s of sessionsRes.sessions) {
        const docs = (s as any).documents as Array<{ fileName: string; contentType: string; uploadedAt: string }> | undefined
        if (docs) {
          for (const d of docs) {
            allDocs.push({
              fileName: d.fileName,
              contentType: d.contentType,
              uploadedAt: d.uploadedAt,
              sessionTitle: s.title,
            })
          }
        }
      }
      setDocuments(allDocs)
    } catch (e) {
      console.error('Failed to load course data:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleSessionReady(sessionId: string) {
    setShowStartModal(false)
    onStartSession(sessionId)
  }

  async function handleSaveName() {
    if (!course || !editName.trim()) return
    try {
      const { course: updated } = await api.updateCourse(course.courseId, { name: editName.trim() }, getIdToken)
      setCourse(updated)
      setEditingName(false)
    } catch (e) {
      console.error('Failed to update course:', e)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await api.deleteSession(sessionId, getIdToken)
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  async function handleViewSummary(session: Session) {
    try {
      const { session: full } = await api.getSession(session.sessionId, getIdToken)
      setViewingSession(full)
    } catch (e) {
      console.error('Failed to load session:', e)
      setViewingSession(session)
    }
  }

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center font-instrument">
        <div className="text-[#6B5B50]">{loading ? 'Loading...' : 'Course not found'}</div>
      </div>
    )
  }

  const c = getColorSet(course.color)
  const Icon = ICON_MAP[course.name.toLowerCase()] || DEFAULT_ICON
  const completedSessions = sessions.filter((s) => s.status === 'completed')

  const sortedSessions = [...completedSessions].sort((a, b) => {
    if (sortMode === 'longest') return (Number(b.durationMinutes) || 0) - (Number(a.durationMinutes) || 0)
    if (sortMode === 'shortest') return (Number(a.durationMinutes) || 0) - (Number(b.durationMinutes) || 0)
    return b.startTime.localeCompare(a.startTime)
  })

  const totalMinutes = completedSessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0)
  const avgMinutes = completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0

  const sortLabels: Record<SortMode, string> = { recent: 'Most Recent', longest: 'Longest', shortest: 'Shortest' }

  const stats = [
    { icon: Clock, value: formatDuration(totalMinutes), label: 'Total Study Time', color: 'text-indigo' },
    { icon: FileText, value: String(completedSessions.length), label: 'Study Sessions', color: 'text-indigo' },
    { icon: BarChart3, value: `${avgMinutes} min`, label: 'Average Session', color: 'text-indigo' },
    { icon: Flame, value: `${completedSessions.length}`, label: 'Sessions Done', color: 'text-amber-500' },
  ]

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col font-instrument">
      {/* Nav */}
      <nav className="h-20 px-[120px] flex items-center justify-between border-b border-cream-border-dark bg-white shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span onClick={onHome} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Home
          </span>
          <span onClick={onBack} className="text-[15px] font-semibold text-indigo-light cursor-pointer">
            Dashboard
          </span>
          <span onClick={onSettings} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Settings
          </span>
          <div className="w-10 h-10 rounded-full bg-indigo-bg border-2 border-indigo-light" />
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-[120px] pt-8 pb-20 flex flex-col gap-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-indigo-dark hover:text-indigo transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Course header */}
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl ${c.iconBg} border ${c.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-7 h-7 ${c.text}`} />
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="font-bold text-[28px] text-indigo-dark bg-transparent border-b-2 border-indigo outline-none w-80"
                />
                <button onClick={handleSaveName} className="w-8 h-8 rounded-full bg-indigo flex items-center justify-center text-white cursor-pointer">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="w-8 h-8 rounded-full bg-cream-border-dark flex items-center justify-center cursor-pointer">
                  <X className="w-4 h-4 text-[#6B5B50]" />
                </button>
              </div>
            ) : (
              <h1 className="font-bold text-[28px] text-indigo-dark">{course.name}</h1>
            )}
            <p className="text-sm text-[#6B5B50]">
              {completedSessions.length} study session{completedSessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditName(course.name); setEditingName(true) }}
              className="flex items-center gap-2 px-5 py-2.5 bg-cream-100 border border-cream-border-dark rounded-lg text-sm font-medium text-indigo-dark hover:bg-cream-200 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Course
            </button>
            <button
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-dark hover:bg-indigo text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Start Study Session
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 flex items-center gap-4 px-6 py-5 bg-card border border-card-border rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-indigo-bg flex items-center justify-center shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <span className="font-bold text-2xl text-indigo-dark block">{stat.value}</span>
                <span className="text-sm text-[#6B5B50]">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Study Sessions */}
        <section className="flex flex-col gap-4 bg-card border border-card-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl text-indigo-dark">Study Sessions</h2>
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-100 border border-cream-border-dark rounded-lg text-sm text-[#6B5B50] hover:bg-cream-200 transition-colors cursor-pointer"
              >
                {sortLabels[sortMode]}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-cream-border-dark rounded-lg shadow-lg z-10 overflow-hidden">
                  {(Object.entries(sortLabels) as [SortMode, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortMode(key); setShowSortDropdown(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-cream-100 transition-colors cursor-pointer ${sortMode === key ? 'text-indigo font-semibold' : 'text-[#6B5B50]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {sortedSessions.length === 0 ? (
            <div className="py-8 text-center text-[#6B5B50] text-sm">
              No sessions yet. Start a study session to see your history here.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-cream-border-dark">
              {sortedSessions.map((session) => {
                const date = new Date(session.startTime)
                const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                const day = date.getDate()
                return (
                  <div key={session.sessionId} className="flex items-center gap-5 py-4">
                    <div className="w-14 h-14 rounded-xl bg-indigo-bg flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-indigo uppercase leading-none">{month}</span>
                      <span className="text-lg font-bold text-indigo-dark leading-tight">{day}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-[15px] text-indigo-dark block">{session.title}</span>
                      <span className="text-sm text-[#6B5B50]">
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#9C8B7E]" />
                        <span className="text-sm text-[#6B5B50]">{session.durationMinutes} min</span>
                      </div>
                      <button
                        onClick={() => handleViewSummary(session)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cream-100 border border-cream-border-dark rounded-lg text-sm font-medium text-[#6B5B50] hover:text-indigo-dark hover:bg-cream-200 transition-colors cursor-pointer"
                      >
                        View Summary
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.sessionId)}
                        className="p-1.5 rounded-lg text-[#9C8B7E] hover:text-[#C24B32] hover:bg-[#FFF0EB] transition-colors cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Course Materials */}
        <section className="flex flex-col gap-4 bg-white border border-cream-border-dark rounded-2xl p-6">
          <h2 className="font-bold text-xl text-indigo-dark">Course Materials</h2>
          {documents.length === 0 ? (
            <div className="py-8 text-center text-[#5C5A80] text-sm">
              No materials yet. Upload files when starting a study session.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-cream-border-dark">
              {documents.map((doc, i) => (
                <div key={`${doc.fileName}-${i}`} className="flex items-center gap-4 py-3.5">
                  <div className={`w-9 h-9 rounded-lg ${c.iconBg} border ${c.border} flex items-center justify-center shrink-0`}>
                    <FileText className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-indigo-dark block truncate">{doc.fileName}</span>
                    <span className="text-xs text-[#9A98B0]">
                      {doc.sessionTitle} &middot; {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showStartModal && course && (
        <StartSessionModal
          courses={[]}
          fixedCourse={{ courseId: course.courseId, name: course.name }}
          onClose={() => setShowStartModal(false)}
          onReady={handleSessionReady}
          getIdToken={getIdToken}
        />
      )}

      {/* Summary Modal */}
      {viewingSession && (
        <SessionSummaryModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  )
}

function SessionSummaryModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const transcript = session.transcript || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-instrument" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(10,9,21,0.55)]" />
      <div
        className="relative w-[640px] max-h-[85vh] bg-white border border-cream-border-dark rounded-3xl shadow-[0_16px_32px_rgba(10,9,21,0.1)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="font-bold text-2xl text-indigo-dark">{session.title}</h2>
            <p className="text-sm text-[#6B5B50] mt-1">
              {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' '}&middot; {session.durationMinutes} min &middot; {session.messageCount} messages
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-cream-border-dark/50 flex items-center justify-center hover:bg-cream-border-dark transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5 text-[#6B5B50]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6">
          {/* AI Summary */}
          {session.summary && (
            <div className="bg-indigo-bg/60 rounded-2xl p-5 flex flex-col gap-2">
              <span className="font-bold text-sm text-indigo">AI Summary</span>
              <p className="text-sm text-indigo-dark leading-relaxed whitespace-pre-wrap">{session.summary}</p>
            </div>
          )}

          {/* Chat History */}
          {transcript.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-sm text-[#6B5B50]">Chat History</span>
              <div className="flex flex-col gap-3">
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-bg border border-indigo-light/20 rounded-tr-sm'
                        : 'bg-white border border-cream-border rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !session.summary ? (
            <div className="py-12 text-center text-[#6B5B50] text-sm">
              No summary or chat history available for this session.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
