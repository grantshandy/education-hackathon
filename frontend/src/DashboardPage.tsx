import { useState, useEffect } from 'react'
import {
  GraduationCap,
  PlayCircle,
  Plus,
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
}: {
  onStartSession: (sessionId: string) => void
  onOpenCourse: (courseId: string) => void
  onLogout?: () => void
  onHome?: () => void
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

  async function handleStartSession(title: string, courseId: string, courseName: string) {
    try {
      const { session } = await api.createSession({ title, courseId, courseName }, getIdToken)
      setShowStartModal(false)
      onStartSession(session.sessionId)
    } catch (e) {
      console.error('Failed to create session:', e)
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
          <span className="text-[15px] font-semibold text-indigo-light cursor-pointer" onClick={onHome}>
            Home
          </span>
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Study Sessions
          </span>
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
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
      <main className="flex-1 px-[120px] pt-16 pb-20 flex flex-col gap-16">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6">
          <h1 className="font-bold text-[44px] text-indigo-dark text-center">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}.
          </h1>
          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center gap-2.5 bg-indigo hover:bg-indigo-dark px-8 py-[18px] rounded-full text-white font-semibold text-base transition-colors cursor-pointer shadow-[0_8px_24px_rgba(192,106,69,0.2)]"
          >
            <PlayCircle className="w-5 h-5" />
            Start Study Session
          </button>
        </section>

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

      </main>

      {showStartModal && (
        <StartSessionModal
          courses={courses}
          onClose={() => setShowStartModal(false)}
          onStart={handleStartSession}
        />
      )}

      {showAddCourseModal && (
        <AddCourseModal
          onClose={() => setShowAddCourseModal(false)}
          onCreate={handleCreateCourse}
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
