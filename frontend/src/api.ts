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
  materialsStatus?: 'processing' | 'ready'
  summary: string | null
  transcript?: TranscriptMessage[]
  lastHeartbeat?: string
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

  updateSession: (sessionId: string, data: Partial<Pick<Session, 'endTime' | 'durationMinutes' | 'messageCount' | 'status' | 'summary' | 'courseId' | 'courseName' | 'lastHeartbeat'>> & { transcript?: TranscriptMessage[] }, getIdToken: TokenGetter): Promise<{ session: Session }> =>
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

  requestUpload: (
    sessionId: string,
    data: { fileName: string; contentType: string },
    getIdToken: TokenGetter,
  ): Promise<{ documentId: string; uploadUrl: string; s3Key: string }> =>
    apiFetch(`/sessions/${sessionId}/upload`, { method: 'POST', body: JSON.stringify(data) }, getIdToken),

  uploadFileToS3: (uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
      xhr.onerror = () => reject(new Error('Upload network error'))
      xhr.send(file)
    })
  },

  processDocuments: (
    sessionId: string,
    getIdToken: TokenGetter,
  ): Promise<{ status: string; ingestionJobId: string | null; documentCount: number }> =>
    apiFetch(`/sessions/${sessionId}/process`, { method: 'POST' }, getIdToken),

  listDocuments: (
    sessionId: string,
    getIdToken: TokenGetter,
  ): Promise<{ documents: Array<{ documentId: string; fileName: string; status: string }> }> =>
    apiFetch(`/sessions/${sessionId}/documents`, {}, getIdToken),
}
