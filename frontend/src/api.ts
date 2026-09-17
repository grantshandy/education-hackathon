const API_URL = import.meta.env.VITE_API_URL as string

async function apiFetch(path: string, options: RequestInit, getIdToken: () => Promise<string | null>) {
  const token = await getIdToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

export interface Course {
  userId: string
  courseId: string
  name: string
  color: string
  createdAt: string
}

export interface TranscriptMessage {
  role: 'user' | 'buddy'
  text: string
}

export interface Session {
  userId: string
  sessionId: string
  courseId: string
  courseName: string
  title: string
  startTime: string
  endTime: string | null
  durationMinutes: number
  messageCount: number
  status: 'active' | 'completed'
  summary: string | null
  transcript?: TranscriptMessage[]
}

type TokenGetter = () => Promise<string | null>

export const api = {
  listCourses: (getIdToken: TokenGetter): Promise<{ courses: Course[] }> =>
    apiFetch('/courses', {}, getIdToken),

  createCourse: (data: { name: string; color: string }, getIdToken: TokenGetter): Promise<{ course: Course }> =>
    apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) }, getIdToken),

  updateCourse: (courseId: string, data: { name?: string; color?: string }, getIdToken: TokenGetter): Promise<{ course: Course }> =>
    apiFetch(`/courses/${courseId}`, { method: 'PATCH', body: JSON.stringify(data) }, getIdToken),

  deleteCourse: (courseId: string, getIdToken: TokenGetter): Promise<{ deleted: boolean }> =>
    apiFetch(`/courses/${courseId}`, { method: 'DELETE' }, getIdToken),

  listSessions: (getIdToken: TokenGetter, courseId?: string): Promise<{ sessions: Session[] }> =>
    apiFetch(`/sessions${courseId ? `?courseId=${courseId}` : ''}`, {}, getIdToken),

  createSession: (data: { courseId: string; courseName: string; title: string }, getIdToken: TokenGetter): Promise<{ session: Session }> =>
    apiFetch('/sessions', { method: 'POST', body: JSON.stringify(data) }, getIdToken),

  getSession: (sessionId: string, getIdToken: TokenGetter): Promise<{ session: Session }> =>
    apiFetch(`/sessions/${sessionId}`, {}, getIdToken),

  updateSession: (sessionId: string, data: Partial<Pick<Session, 'endTime' | 'durationMinutes' | 'messageCount' | 'status' | 'summary'>> & { transcript?: TranscriptMessage[] }, getIdToken: TokenGetter): Promise<{ session: Session }> =>
    apiFetch(`/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify(data) }, getIdToken),

  deleteSession: (sessionId: string, getIdToken: TokenGetter): Promise<{ deleted: boolean }> =>
    apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' }, getIdToken),

  generateSummary: (sessionId: string, getIdToken: TokenGetter): Promise<{ summary: string }> =>
    apiFetch(`/sessions/${sessionId}/summary`, { method: 'POST' }, getIdToken),

  transcribeAudio: async (blob: Blob, getIdToken: TokenGetter): Promise<{ text: string }> => {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': blob.type,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: blob,
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`transcribe ${res.status}: ${body}`)
    }
    return res.json()
  },
}
