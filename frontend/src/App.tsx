import { useState } from 'react'
import HomePage from './HomePage'
import StudySession from './StudySession'

export default function App() {
  const [page, setPage] = useState<'home' | 'session'>('home')

  if (page === 'session') {
    return <StudySession onExit={() => setPage('home')} />
  }

  return <HomePage onStart={() => setPage('session')} />
}
