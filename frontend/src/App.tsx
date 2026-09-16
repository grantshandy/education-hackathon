import { useState } from 'react'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import HomePage from './HomePage'
import DashboardPage from './DashboardPage'
import StudySession from './StudySession'

type Page = 'home' | 'login' | 'signup' | 'dashboard' | 'session'

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
      return <DashboardPage onStartSession={() => setPage('session')} />
    case 'session':
      return <StudySession onExit={() => setPage('dashboard')} />
    default:
      return <HomePage onStart={() => setPage('login')} />
  }
}
