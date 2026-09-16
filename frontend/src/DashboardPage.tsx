import { useState } from 'react'
import {
  GraduationCap,
  PlayCircle,
  Binary,
  FlaskRound,
  BarChart3,
  BookOpen,
  Brain,
  Plus,
  Calendar,
  Clock,
} from 'lucide-react'
import StartSessionModal from './StartSessionModal'
import AddCourseModal from './AddCourseModal'

const COURSES = [
  {
    name: 'Algorithms',
    icon: Binary,
    materials: 8,
    sessions: 4,
    bg: 'bg-[#FFF1F2]',
    border: 'border-[#FFE4E6]',
    text: 'text-[#E11D48]',
    iconBg: 'bg-white/70',
  },
  {
    name: 'Organic Chemistry',
    icon: FlaskRound,
    materials: 12,
    sessions: 6,
    bg: 'bg-[#F0F9FF]',
    border: 'border-[#E0F2FE]',
    text: 'text-[#0369A1]',
    iconBg: 'bg-white/70',
  },
  {
    name: 'Linear Algebra',
    icon: BarChart3,
    materials: 5,
    sessions: 3,
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#DCFCE7]',
    text: 'text-[#15803D]',
    iconBg: 'bg-white/70',
  },
  {
    name: 'US History',
    icon: BookOpen,
    materials: 10,
    sessions: 5,
    bg: 'bg-[#FEFCE8]',
    border: 'border-[#FEF9C3]',
    text: 'text-[#A16207]',
    iconBg: 'bg-white/70',
  },
  {
    name: 'Intro to Psychology',
    icon: Brain,
    materials: 7,
    sessions: 2,
    bg: 'bg-[#FAF5FF]',
    border: 'border-[#F3E8FF]',
    text: 'text-[#6D28D9]',
    iconBg: 'bg-white/70',
  },
]

const SESSIONS = [
  {
    course: 'Algorithms',
    courseBg: 'bg-[#FFF1F2]',
    courseText: 'text-[#E11D48]',
    title: 'Dijkstra & Shortest Paths',
    date: 'Yesterday',
    duration: '42 min',
  },
  {
    course: 'Organic Chemistry',
    courseBg: 'bg-[#F0F9FF]',
    courseText: 'text-[#0369A1]',
    title: 'Reaction Mechanisms',
    date: '2 days ago',
    duration: '28 min',
  },
  {
    course: 'Linear Algebra',
    courseBg: 'bg-[#F0FDF4]',
    courseText: 'text-[#15803D]',
    title: 'Eigenvalues & Diagonalization',
    date: '3 days ago',
    duration: '55 min',
  },
  {
    course: 'No Course',
    courseBg: 'bg-[#F3F4F6]',
    courseText: 'text-[#5C5A80]',
    title: 'General Review',
    date: 'Last week',
    duration: '20 min',
  },
]

export default function DashboardPage({
  onStartSession,
  onOpenCourse,
  onLogout,
}: {
  onStartSession: () => void
  onOpenCourse: () => void
  onLogout?: () => void
}) {
  const [showStartModal, setShowStartModal] = useState(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const greeting = getGreeting()

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col font-instrument">
      {/* Nav */}
      <nav className="h-20 px-[120px] flex items-center justify-between border-b border-cream-border-dark bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-[15px] font-medium text-indigo-dark cursor-pointer">
            Home
          </span>
          <span className="text-[15px] font-medium text-[#5C5A80] cursor-pointer hover:text-indigo-dark transition-colors">
            Settings
          </span>
          <button
            onClick={onLogout}
            className="text-[15px] font-medium text-[#5C5A80] cursor-pointer hover:text-indigo-dark transition-colors"
          >
            Sign out
          </button>
          <div className="w-9 h-9 rounded-full bg-cream-border-dark" />
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-[120px] pt-16 pb-20 flex flex-col gap-16">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6">
          <h1 className="font-bold text-[44px] text-indigo-dark text-center">
            {greeting}, Steven.
          </h1>
          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center gap-2.5 bg-indigo hover:bg-indigo-dark px-8 py-[18px] rounded-full text-white font-semibold text-base transition-colors cursor-pointer shadow-[0_8px_24px_rgba(79,70,229,0.2)]"
          >
            <PlayCircle className="w-5 h-5" />
            Start Study Session
          </button>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span className="text-sm font-medium text-[#5C5A80]">
                4 day study streak
              </span>
            </div>
            <div className="w-px h-4 bg-cream-border-dark" />
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-sm font-medium text-[#5C5A80]">
                6.5 hours studied this week
              </span>
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="flex flex-col gap-5">
          <h2 className="font-bold text-[22px] text-indigo-dark">
            Your Courses
          </h2>
          <div className="flex gap-4">
            {COURSES.map((course) => (
              <div
                key={course.name}
                onClick={onOpenCourse}
                className={`flex-1 h-[180px] p-6 rounded-[20px] ${course.bg} border ${course.border} flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${course.iconBg} flex items-center justify-center`}
                  >
                    <course.icon className={`w-5 h-5 ${course.text}`} />
                  </div>
                  <span
                    className={`font-semibold text-lg leading-snug ${course.text}`}
                  >
                    {course.name}
                  </span>
                </div>
                <span className={`text-[13px] font-medium ${course.text} opacity-80`}>
                  {course.materials} materials · {course.sessions} sessions
                </span>
              </div>
            ))}
            <div
              onClick={() => setShowAddCourseModal(true)}
              className="flex-1 h-[180px] p-6 rounded-[20px] border border-dashed border-cream-dash-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-ink-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-[20px] border border-cream-dash-border flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#5C5A80]" />
              </div>
              <span className="text-sm font-semibold text-[#5C5A80]">
                Add Course
              </span>
            </div>
          </div>
        </section>

        {/* Recent Sessions */}
        <section className="flex flex-col gap-5">
          <h2 className="font-bold text-[22px] text-indigo-dark">
            Recent Sessions
          </h2>
          <div className="flex flex-col gap-3">
            {SESSIONS.map((session) => (
              <div
                key={session.title}
                className="flex items-center justify-between px-5 py-5 bg-white border border-cream-border-dark rounded-2xl cursor-pointer hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-6">
                  <span
                    className={`${session.courseBg} ${session.courseText} text-xs font-semibold px-3 py-1.5 rounded-full`}
                  >
                    {session.course}
                  </span>
                  <span className="font-medium text-base text-indigo-dark">
                    {session.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9A98B0]" />
                    <span className="text-sm text-[#5C5A80]">
                      {session.date}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-cream-border-dark" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9A98B0]" />
                    <span className="text-sm text-[#5C5A80]">
                      {session.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showStartModal && (
        <StartSessionModal
          onClose={() => setShowStartModal(false)}
          onStart={() => {
            setShowStartModal(false)
            onStartSession()
          }}
        />
      )}

      {showAddCourseModal && (
        <AddCourseModal
          onClose={() => setShowAddCourseModal(false)}
          onCreate={() => setShowAddCourseModal(false)}
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
