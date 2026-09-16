import { useRef, useState } from 'react'
import {
  X,
  ChevronDown,
  UploadCloud,
  FileText,
} from 'lucide-react'

const COURSE_OPTIONS = [
  'No Course',
  'Algorithms',
  'Organic Chemistry',
  'Linear Algebra',
  'US History',
  'Intro to Psychology',
]

export default function StartSessionModal({
  onClose,
  onStart,
}: {
  onClose: () => void
  onStart: () => void
}) {
  const [sessionName, setSessionName] = useState('Study Session')
  const [course, setCourse] = useState('No Course')
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    setFiles((prev) => [...prev, ...Array.from(newFiles)])
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-instrument"
      onClick={onClose}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-[rgba(10,9,21,0.55)]" />

      {/* Modal */}
      <div
        className="relative w-[560px] max-h-[90vh] overflow-y-auto bg-cream-100 border border-cream-border-dark rounded-3xl p-8 flex flex-col gap-7 shadow-[0_16px_32px_rgba(10,9,21,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl text-indigo-dark">
            Start Study Session
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-border-dark/50 flex items-center justify-center hover:bg-cream-border-dark transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-ink-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          {/* Session Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#5C5A80]">
              Session Name
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Study Session"
              className="h-11 px-4 border border-cream-muted rounded-[10px] text-[15px] text-indigo-dark placeholder-[#5C5A80] outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors bg-white"
            />
          </div>

          {/* Course */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#5C5A80]">
              Course
            </label>
            <div className="relative">
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full h-11 px-4 pr-10 border border-cream-muted rounded-[10px] text-[15px] text-[#5C5A80] outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors bg-white appearance-none cursor-pointer"
              >
                {COURSE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5A80] pointer-events-none" />
            </div>
          </div>

          {/* Study Materials */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold text-[#5C5A80]">
              Study Materials
            </label>

            {/* Dropzone */}
            <div
              className={`flex flex-col items-center gap-3 py-8 px-6 border border-dashed rounded-[14px] transition-colors bg-white ${
                dragging
                  ? 'border-indigo bg-indigo-bg'
                  : 'border-cream-dash-border'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                addFiles(e.dataTransfer.files)
              }}
            >
              <div className="w-10 h-10 rounded-[20px] bg-indigo-bg flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-indigo-light" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-indigo-dark">
                  Drag and drop files here
                </span>
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
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between px-3 py-2.5 bg-white border border-[#EAE6DF] rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-light shrink-0" />
                      <span className="text-[13px] font-medium text-indigo-dark truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="shrink-0 cursor-pointer text-ink-muted hover:text-ink-secondary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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
            className="text-[15px] font-semibold text-[#5C5A80] hover:text-indigo-dark transition-colors cursor-pointer px-1"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-indigo hover:bg-indigo-dark text-white font-semibold text-[15px] px-6 py-3 rounded-full transition-colors cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.15)]"
          >
            Start Study Session
          </button>
        </div>
      </div>
    </div>
  )
}
