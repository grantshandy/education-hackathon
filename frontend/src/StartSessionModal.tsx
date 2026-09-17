import { useRef, useState, useCallback } from 'react'
import {
  X,
  ChevronDown,
  UploadCloud,
  FileText,
  Check,
  Loader2,
} from 'lucide-react'
import type { Course } from './api'
import { api } from './api'

type FileEntry = {
  name: string
  progress: number
  phase: 'uploading' | 'done' | 'error'
}

export default function StartSessionModal({
  courses,
  onClose,
  onReady,
  getIdToken,
  fixedCourse,
}: {
  courses: Course[]
  onClose: () => void
  onReady: (sessionId: string) => void
  getIdToken: () => Promise<string | null>
  fixedCourse?: { courseId: string; name: string }
}) {
  const [sessionName, setSessionName] = useState('Study Session')
  const [selectedCourseId, setSelectedCourseId] = useState(fixedCourse?.courseId ?? '')
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [starting, setStarting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Eagerly created session — shared across uploads
  const sessionRef = useRef<{ id: string; promise: Promise<string> } | null>(null)

  const getOrCreateSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current.promise
    const promise = (async () => {
      const course = courses.find(c => c.courseId === selectedCourseId)
      const courseName = fixedCourse?.name || course?.name || ''
      const { session } = await api.createSession(
        { title: sessionName || 'Study Session', courseId: selectedCourseId, courseName },
        getIdToken,
      )
      return session.sessionId
    })()
    sessionRef.current = { id: '', promise }
    const id = await promise
    sessionRef.current = { id, promise }
    return id
  }, [courses, fixedCourse, selectedCourseId, sessionName, getIdToken])

  async function uploadFile(file: File, index: number) {
    try {
      const sessionId = await getOrCreateSession()
      const { uploadUrl } = await api.requestUpload(
        sessionId,
        { fileName: file.name, contentType: file.type || 'application/octet-stream' },
        getIdToken,
      )
      await api.uploadFileToS3(uploadUrl, file, (pct) => {
        setFileEntries(prev => prev.map((f, j) => j === index ? { ...f, progress: pct } : f))
      })
      setFileEntries(prev => prev.map((f, j) => j === index ? { ...f, phase: 'done', progress: 100 } : f))
      api.processDocuments(sessionId, getIdToken).catch(() => {})
    } catch (e) {
      console.error('Upload failed:', e)
      setFileEntries(prev => prev.map((f, j) => j === index ? { ...f, phase: 'error' } : f))
    }
  }

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const startIdx = fileEntries.length
    const added = Array.from(newFiles)
    const newEntries: FileEntry[] = added.map(f => ({ name: f.name, progress: 0, phase: 'uploading' }))
    setFileEntries(prev => [...prev, ...newEntries])
    added.forEach((file, i) => uploadFile(file, startIdx + i))
  }

  const uploading = fileEntries.some(f => f.phase === 'uploading')
  const hasFiles = fileEntries.length > 0

  async function handleStart() {
    setStarting(true)
    try {
      const sessionId = await getOrCreateSession()

      if (hasFiles) {
        api.processDocuments(sessionId, getIdToken).catch(() => {})
      }

      onReady(sessionId)
    } catch (e) {
      console.error('Failed to start session:', e)
      setStarting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-instrument"
      onClick={() => !starting && !uploading && onClose()}
    >
      <div className="absolute inset-0 bg-[rgba(10,9,21,0.55)]" />

      <div
        className="relative w-[560px] max-h-[90vh] overflow-y-auto bg-cream-100 border border-cream-border-dark rounded-3xl p-8 flex flex-col gap-7 shadow-[0_16px_32px_rgba(10,9,21,0.1)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl text-indigo-dark">Start Study Session</h2>
          {!starting && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-cream-border-dark/50 flex items-center justify-center hover:bg-cream-border-dark transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-ink-secondary" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* Session Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#5C5A80]">Session Name</label>
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              disabled={starting}
              placeholder="Study Session"
              className="h-11 px-4 border border-cream-muted rounded-[10px] text-[15px] text-indigo-dark placeholder-[#5C5A80] outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors bg-white disabled:opacity-50"
            />
          </div>

          {/* Course */}
          {!fixedCourse && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#5C5A80]">Course</label>
              <div className="relative">
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  disabled={starting}
                  className="w-full h-11 px-4 pr-10 border border-cream-muted rounded-[10px] text-[15px] text-[#5C5A80] outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors bg-white appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">No Course</option>
                  {courses.map(course => (
                    <option key={course.courseId} value={course.courseId}>{course.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5A80] pointer-events-none" />
              </div>
            </div>
          )}

          {/* Study Materials */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold text-[#5C5A80]">Study Materials</label>

            {/* Dropzone */}
            <div
              className={`flex flex-col items-center gap-3 py-8 px-6 border border-dashed rounded-[14px] transition-colors bg-white ${
                dragging ? 'border-indigo bg-indigo-bg' : 'border-cream-dash-border'
              }`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            >
              <div className="w-10 h-10 rounded-[20px] bg-indigo-bg flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-indigo-light" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-indigo-dark">Drag and drop files here</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-indigo underline cursor-pointer"
                >
                  Browse files
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => { addFiles(e.target.files); if (e.target) e.target.value = '' }}
              />
            </div>

            {/* File list */}
            {fileEntries.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {fileEntries.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="px-3 pt-2.5 pb-2 bg-white border border-[#EAE6DF] rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-light shrink-0" />
                        <span className="text-[13px] font-medium text-indigo-dark truncate">
                          {file.name}
                        </span>
                      </div>
                      <div className="shrink-0 ml-2 flex items-center gap-2">
                        {file.phase === 'uploading' && (
                          <span className="text-[11px] font-medium tabular-nums" style={{ color: '#5C5A80' }}>
                            {file.progress}%
                          </span>
                        )}
                        {file.phase === 'done' ? (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                            <Check className="w-3 h-3" style={{ color: '#16a34a' }} />
                          </div>
                        ) : file.phase === 'uploading' ? (
                          <Loader2 className="w-4 h-4 text-indigo animate-spin" />
                        ) : (
                          <span className="text-xs" style={{ color: '#ef4444' }}>Failed</span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E1DA' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${file.progress}%`,
                          backgroundColor: file.phase === 'done' ? '#22c55e' : file.phase === 'error' ? '#ef4444' : '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            disabled={starting}
            className="text-[15px] font-semibold text-[#5C5A80] hover:text-indigo-dark disabled:opacity-30 transition-colors cursor-pointer px-1"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={uploading || starting}
            className="flex items-center gap-2 bg-indigo hover:bg-indigo-dark disabled:opacity-50 text-white font-semibold text-[15px] px-6 py-3 rounded-full transition-colors cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.15)]"
          >
            {starting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
            ) : uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              'Start Study Session'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
