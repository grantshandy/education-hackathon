import { useState, useMemo } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import HomePage from './HomePage'
import DashboardPage from './DashboardPage'
import StudySession from './StudySession'
import CoursePage from './CoursePage'
import { Binary } from 'lucide-react'

const isDev = import.meta.env.DEV

type Page = 'home' | 'login' | 'signup' | 'dashboard' | 'session' | 'course'

function AppRoutes() {
  const { user, loading, logout } = useAuth()
  const [page, setPage] = useState<Page>('home')
  const [debugBypass, setDebugBypass] = useState(false)

  const effectivePage = useMemo(() => {
    if (debugBypass) return page
    if (user && (page === 'home' || page === 'login' || page === 'signup'))
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
          onBack={() => setPage('home')}
        />
      )
    case 'signup':
      return (
        <SignupPage
          onSignup={() => setPage('login')}
          onSwitchToLogin={() => setPage('login')}
          onBack={() => setPage('home')}
        />
      )
    case 'dashboard':
      return (
        <DashboardPage
          onStartSession={() => setPage('session')}
          onOpenCourse={() => setPage('course')}
          onLogout={async () => {
            await logout()
            setPage('home')
          }}
        />
      )
    case 'session':
      return <StudySession onExit={() => setPage('dashboard')} />
    case 'course':
      return (
        <CoursePage
          courseName="Algorithms"
          courseIcon={Binary}
          color="red"
          materials={8}
          sessions={4}
          onBack={() => setPage('dashboard')}
          onStartSession={() => setPage('session')}
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
