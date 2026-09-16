import { useState, useMemo } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import ForgotPasswordPage from './ForgotPasswordPage'
import SignupPage from './SignupPage'
import HomePage from './HomePage'
import DashboardPage from './DashboardPage'
import StudySession from './StudySession'
import CoursePage from './CoursePage'

const isDev = import.meta.env.DEV

type Page = 'home' | 'login' | 'signup' | 'forgot-password' | 'dashboard' | 'session' | 'course'

function AppRoutes() {
  const { user, loading, logout } = useAuth()
  const [page, setPage] = useState<Page>('home')
  const [debugBypass, setDebugBypass] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const effectivePage = useMemo(() => {
    if (debugBypass) return page
    if (user && (page === 'home' || page === 'login' || page === 'signup' || page === 'forgot-password'))
      return 'dashboard' as const
    if (!user && (page === 'dashboard' || page === 'session' || page === 'course'))
      return 'login' as const
    return page
  }, [user, page, debugBypass])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream-100 font-instrument">
        <div className="text-ink-muted">Loading…</div>
      </div>
    )
  }

  switch (effectivePage) {
    case 'login':
      return (
        <LoginPage
          onLogin={() => setPage('dashboard')}
          onSwitchToSignup={() => setPage('signup')}
          onForgotPassword={() => setPage('forgot-password')}
          onBack={() => setPage('home')}
        />
      )
    case 'forgot-password':
      return (
        <ForgotPasswordPage
          onDone={() => setPage('login')}
          onBack={() => setPage('login')}
        />
      )
    case 'signup':
      return (
        <SignupPage
          onSignup={() => setPage('dashboard')}
          onSwitchToLogin={() => setPage('login')}
          onBack={() => setPage('home')}
        />
      )
    case 'dashboard':
      return (
        <DashboardPage
          onStartSession={(sessionId) => {
            setActiveSessionId(sessionId)
            setPage('session')
          }}
          onOpenCourse={(courseId) => {
            setSelectedCourseId(courseId)
            setPage('course')
          }}
          onLogout={async () => {
            await logout()
            setPage('home')
          }}
        />
      )
    case 'session':
      return <StudySession sessionId={activeSessionId} onExit={() => setPage('dashboard')} />
    case 'course':
      return (
        <CoursePage
          courseId={selectedCourseId!}
          onBack={() => setPage('dashboard')}
          onStartSession={(sessionId) => {
            setActiveSessionId(sessionId)
            setPage('session')
          }}
        />
      )
    default:
      return (
        <HomePage
          onStart={() => setPage('login')}
          onDebugSession={isDev ? () => { setDebugBypass(true); setPage('session') } : undefined}
        />
      )
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
