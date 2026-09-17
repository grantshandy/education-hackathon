import { useState, useEffect } from 'react'
import {
  GraduationCap,
  PlayCircle,
  Plus,
  Clock,
  Flame,
  BookOpen,
  ChevronRight,
  Trash2,
  FolderInput,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import StartSessionModal from './StartSessionModal'
import AddCourseModal from './AddCourseModal'
import { useAuth } from './AuthContext'
import { api, type Course, type Session } from './api'
import { getColorSet, DEFAULT_ICON, ICON_MAP } from './courseStyles'

export default function DashboardPage({
  onStartSession,
  onOpenCourse,
  onLogout,
  onHome,
  onSettings,
}: {
  onStartSession: (sessionId: string) => void
  onOpenCourse: (courseId: string) => void
  onLogout?: () => void
  onHome?: () => void
  onSettings?: () => void
}) {
  const { user, getIdToken } = useAuth()
  const [showStartModal, setShowStartModal] = useState(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const greeting = getGreeting()

  useEffect(() => {
    async function load() {
      try {
        const [coursesRes, sessionsRes] = await Promise.all([
          api.listCourses(getIdToken),
          api.listSessions(getIdToken),
        ])
        setCourses(coursesRes.courses)
        setSessions(sessionsRes.sessions)
      } catch (e) {
        console.error('Failed to load data:', e)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [getIdToken])

  async function handleCreateCourse(name: string, color: string) {
    try {
      const { course } = await api.createCourse({ name, color }, getIdToken)
      setCourses((prev) => [...prev, course])
      setShowAddCourseModal(false)
    } catch (e) {
      console.error('Failed to create course:', e)
    }
  }

  function handleSessionReady(sessionId: string) {
    setShowStartModal(false)
    onStartSession(sessionId)
  }

  const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null)
  const [savingAssign, setSavingAssign] = useState(false)
  const [assignedSessionId, setAssignedSessionId] = useState<string | null>(null)
  const [viewingSession, setViewingSession] = useState<Session | null>(null)

  const unorganizedSessions = sessions
    .filter((s) => !s.courseId && s.status === 'completed')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))

  async function handleAssignCourse(sessionId: string, courseId: string) {
    const course = courses.find((c) => c.courseId === courseId)
    if (!course) return
    setSavingAssign(true)
    try {
      await api.updateSession(sessionId, { courseId, courseName: course.name }, getIdToken)
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, courseId, courseName: course.name } : s)),
      )
      setAssigningSessionId(null)
      setAssignedSessionId(sessionId)
      setTimeout(() => setAssignedSessionId(null), 1500)
    } catch (e) {
      console.error('Failed to assign session:', e)
      alert('Failed to assign session. Please try again.')
    } finally {
      setSavingAssign(false)
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
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors" onClick={onHome}>
            Home
          </span>
          <span className="text-[15px] font-semibold text-indigo-light cursor-pointer">
            Dashboard
          </span>
          <span onClick={onSettings} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Settings
          </span>
          <button
            onClick={onLogout}
            className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors"
          >
            Sign out
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-bg border-2 border-indigo-light" />
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-[120px] pt-10 pb-20 flex flex-col gap-10">
        {/* Welcome banner */}
        <section className="flex items-stretch bg-card border border-card-border rounded-3xl overflow-hidden">
          <div className="flex-1 p-10 flex flex-col justify-center gap-5">
            <h1 className="font-bold text-[36px] text-indigo-dark leading-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}.
            </h1>
            <p className="text-base text-ink-secondary leading-relaxed max-w-md">
              Ready to pick up where you left off? Start a new session or continue reviewing your courses.
            </p>
            <button
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2.5 bg-indigo hover:bg-indigo-dark px-7 py-3.5 rounded-xl text-white font-semibold text-[15px] transition-colors cursor-pointer shadow-[0_8px_24px_rgba(192,106,69,0.2)] w-fit"
            >
              <PlayCircle className="w-5 h-5" />
              Start Study Session
            </button>
          </div>
          <div className="w-[320px] shrink-0">
            <img
              src="/lofi-hero.png"
              alt="Lo-fi study illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Quick stats */}
        {!loadingData && (
          <section className="flex gap-4">
            {(() => {
              const completed = sessions.filter(s => s.status === 'completed')
              const totalMin = completed.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0)
              const hours = Math.floor(totalMin / 60)
              const mins = totalMin % 60
              const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
              const uniqueDays = new Set(completed.map(s => s.startTime.slice(0, 10))).size
              return [
                { icon: Clock, label: 'Total Study Time', value: timeStr },
                { icon: BookOpen, label: 'Sessions Completed', value: String(completed.length) },
                { icon: Flame, label: 'Courses Active', value: String(courses.length) },
                { icon: Flame, label: 'Days Studied', value: String(uniqueDays) },
              ]
            })().map((stat) => (
              <div key={stat.label} className="flex-1 flex items-center gap-3.5 bg-card border border-card-border rounded-2xl px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-bg flex items-center justify-center shrink-0">
                  <stat.icon className="w-[18px] h-[18px] text-indigo" />
                </div>
                <div>
                  <span className="font-bold text-xl text-indigo-dark block leading-tight">{stat.value}</span>
                  <span className="text-xs text-ink-secondary">{stat.label}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Courses */}
        <section className="flex flex-col gap-5">
          <h2 className="font-bold text-[22px] text-indigo-dark">
            Your Courses
          </h2>
          {loadingData ? (
            <div className="text-[#6B5B50] text-sm">Loading courses...</div>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {courses.map((course) => {
                const colors = getColorSet(course.color)
                const Icon = ICON_MAP[course.name.toLowerCase()] || DEFAULT_ICON
                const sessionCount = sessions.filter(s => s.courseId === course.courseId).length
                return (
                  <div
                    key={course.courseId}
                    onClick={() => onOpenCourse(course.courseId)}
                    className={`flex-1 min-w-[180px] max-w-[240px] h-[180px] p-6 rounded-[20px] ${colors.bg} border ${colors.border} flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="flex flex-col gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <span
                        className={`font-semibold text-lg leading-snug ${colors.text}`}
                      >
                        {course.name}
                      </span>
                    </div>
                    <span className={`text-[13px] font-medium ${colors.text} opacity-80`}>
                      {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
              <div
                onClick={() => setShowAddCourseModal(true)}
                className="flex-1 min-w-[180px] max-w-[240px] h-[180px] p-6 rounded-[20px] border border-dashed border-cream-dash-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-ink-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-[20px] border border-cream-dash-border flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#6B5B50]" />
                </div>
                <span className="text-sm font-semibold text-[#6B5B50]">
                  Add Course
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        {!loadingData && (() => {
          const recent = sessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => b.startTime.localeCompare(a.startTime))
            .slice(0, 3)
          if (recent.length === 0) return null
          return (
            <section className="flex flex-col gap-5">
              <h2 className="font-bold text-[22px] text-indigo-dark">
                Recent Activity
              </h2>
              <div className="flex flex-col bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                {recent.map((session) => {
                  const date = new Date(session.startTime)
                  const timeAgo = getTimeAgo(date)
                  return (
                    <div
                      key={session.sessionId}
                      onClick={() => {
                        const course = courses.find(c => c.courseId === session.courseId)
                        if (course) onOpenCourse(course.courseId)
                      }}
                      className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-cream-100/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-bg flex items-center justify-center shrink-0">
                        <BookOpen className="w-[18px] h-[18px] text-indigo" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[15px] text-indigo-dark block truncate">{session.title}</span>
                        <span className="text-sm text-ink-secondary">{session.courseName} &middot; {session.durationMinutes} min</span>
                      </div>
                      <span className="text-sm text-ink-muted shrink-0">{timeAgo}</span>
                      <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        {/* Unorganized Sessions */}
        {!loadingData && unorganizedSessions.length > 0 && (
          <section className="flex flex-col gap-4 bg-white border border-cream-border-dark rounded-2xl p-6">
            <h2 className="font-bold text-[22px] text-indigo-dark">
              Unorganized Sessions
            </h2>
            <p className="text-sm text-[#5C5A80] -mt-2">
              Sessions not assigned to any course
            </p>
            <div className="flex flex-col divide-y divide-cream-border-dark">
              {unorganizedSessions.map((session) => {
                const date = new Date(session.startTime)
                const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                const day = date.getDate()
                const isAssigning = assigningSessionId === session.sessionId
                return (
                  <div key={session.sessionId} className="flex items-center gap-5 py-4">
                    <div className="w-14 h-14 rounded-xl bg-indigo-bg flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-indigo uppercase leading-none">{month}</span>
                      <span className="text-lg font-bold text-indigo-dark leading-tight">{day}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-[15px] text-indigo-dark block">{session.title}</span>
                      <span className="text-sm text-[#5C5A80]">
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#9A98B0]" />
                        <span className="text-sm text-[#5C5A80]">{session.durationMinutes} min</span>
                      </div>

                      {/* Assign to course */}
                      <div className="relative">
                        {isAssigning ? (
                          <div className="flex items-center gap-1">
                            {savingAssign ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo/30 rounded-lg text-sm font-medium text-indigo">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Assigning...
                              </div>
                            ) : (
                              <>
                                <select
                                  autoFocus
                                  className="text-sm border border-cream-border-dark rounded-lg px-2 py-1.5 text-indigo-dark bg-white outline-none focus:border-indigo/50 cursor-pointer"
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) handleAssignCourse(session.sessionId, e.target.value)
                                  }}
                                >
                                  <option value="" disabled>Select course...</option>
                                  {courses.map((c) => (
                                    <option key={c.courseId} value={c.courseId}>{c.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => setAssigningSessionId(null)}
                                  className="p-1 rounded-lg text-[#9A98B0] hover:text-[#5C5A80] transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : assignedSessionId === session.sessionId ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            Assigned
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningSessionId(session.sessionId)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-cream-border-dark rounded-lg text-sm font-medium text-[#5C5A80] hover:text-indigo-dark hover:border-indigo/30 transition-colors cursor-pointer"
                            title="Assign to course"
                          >
                            <FolderInput className="w-3.5 h-3.5" />
                            Assign
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewSummary(session)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-cream-border-dark rounded-lg text-sm font-medium text-[#5C5A80] hover:text-indigo-dark hover:border-indigo/30 transition-colors cursor-pointer"
                      >
                        View Summary
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.sessionId)}
                        className="p-1.5 rounded-lg text-[#9A98B0] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>

      {showStartModal && (
        <StartSessionModal
          courses={courses}
          onClose={() => setShowStartModal(false)}
          onReady={handleSessionReady}
          getIdToken={getIdToken}
        />
      )}

      {showAddCourseModal && (
        <AddCourseModal
          onClose={() => setShowAddCourseModal(false)}
          onCreate={handleCreateCourse}
        />
      )}

      {viewingSession && (
        <SessionSummaryModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
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
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="font-bold text-2xl text-indigo-dark">{session.title}</h2>
            <p className="text-sm text-[#5C5A80] mt-1">
              {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' '}&middot; {session.durationMinutes} min &middot; {session.messageCount} messages
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-cream-border-dark/50 flex items-center justify-center hover:bg-cream-border-dark transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5 text-[#5C5A80]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6">
          {session.summary && (
            <div className="bg-indigo-bg/60 rounded-2xl p-5 flex flex-col gap-2">
              <span className="font-bold text-sm text-indigo">AI Summary</span>
              <p className="text-sm text-indigo-dark leading-relaxed whitespace-pre-wrap">{session.summary}</p>
            </div>
          )}

          {transcript.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-sm text-[#5C5A80]">Chat History</span>
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
            <div className="py-12 text-center text-[#5C5A80] text-sm">
              No summary or chat history available for this session.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
