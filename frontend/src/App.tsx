import { useState } from 'react'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import HomePage from './HomePage'
import DashboardPage from './DashboardPage'
import StudySession from './StudySession'
import CoursePage from './CoursePage'
import { Binary } from 'lucide-react'

type Page = 'home' | 'login' | 'signup' | 'dashboard' | 'session' | 'course'

export default function App() {
  const [page, setPage] = useState<Page>('home')

  switch (page) {
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
          onSignup={() => setPage('dashboard')}
          onSwitchToLogin={() => setPage('login')}
          onBack={() => setPage('home')}
        />
      )
    case 'dashboard':
      return (
        <DashboardPage
          onStartSession={() => setPage('session')}
          onOpenCourse={() => setPage('course')}
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
      return <HomePage onStart={() => setPage('login')} />
  }
}
