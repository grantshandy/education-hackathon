import { useState } from 'react'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import HomePage from './HomePage'
import StudySession from './StudySession'

type Page = 'login' | 'signup' | 'home' | 'session'

export default function App() {
  const [page, setPage] = useState<Page>('login')

  switch (page) {
    case 'login':
      return (
        <LoginPage
          onLogin={() => setPage('home')}
          onSwitchToSignup={() => setPage('signup')}
          onBack={() => setPage('home')}
        />
      )
    case 'signup':
      return (
        <SignupPage
          onSignup={() => setPage('home')}
          onSwitchToLogin={() => setPage('login')}
          onBack={() => setPage('home')}
        />
      )
    case 'session':
      return <StudySession onExit={() => setPage('home')} />
    default:
      return <HomePage onStart={() => setPage('session')} />
  }
}
