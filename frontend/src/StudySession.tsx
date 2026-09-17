import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from './AuthContext'
import { useStudyBuddy } from './useStudyBuddy'
import { api } from './api'
import { CharacterCanvas } from './CharacterCanvas'
import { LofiBackground, MUSIC_URL, CHAR_X, CHAR_Y, CHAR_SCALE, DEV_OVERLAY, DEBUG } from './LofiBackground'
import PostStudyModal from './PostStudyModal'
import {
  GraduationCap,
  Mic,
  MicOff,
  Paperclip,
  ArrowUp,
  Square,
  Play,
  Pause,
  Music,
  X,
  FileText,
  Loader2,
  Check,
} from 'lucide-react'

const REST_IMAGE      = '/studying.png'
const ATTENTION_IMAGE = '/at-attention.png'

export default function StudySession({ sessionId, onExit, onHome, onSettings }: { sessionId: string | null; onExit: () => void; onHome?: () => void; onSettings?: () => void }) {
  const { getIdToken } = useAuth()
  const { appState, transcript, currentViseme, send, stopSpeaking, connected } = useStudyBuddy(getIdToken, sessionId)
  const [input, setInput] = useState('')
  const [charX, setCharX] = useState(CHAR_X)
  const [charY, setCharY] = useState(CHAR_Y)
  const [charScale, setCharScale] = useState(CHAR_SCALE)
  const [showPostStudy, setShowPostStudy] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [paused, setPaused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; status: 'uploading' | 'ready' | 'error' }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  function dbg(msg: string) {
    if (!DEBUG) return
    const ts = new Date().toISOString().slice(11, 23)
    console.log(`[debug ${ts}]`, msg)
    setDebugLog((prev) => [...prev.slice(-49), `${ts} ${msg}`])
  }
  const musicRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fadeRef = useRef<number | null>(null)
  const [sessionStart] = useState(() => new Date())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStart])

  const sessionEndedRef = useRef(false)
  const cachedTokenRef = useRef<string | null>(null)

  // Cache auth token so beforeunload can use it synchronously
  useEffect(() => {
    let cancelled = false
    async function refreshToken() {
      const token = await getIdToken()
      if (!cancelled) cachedTokenRef.current = token
    }
    refreshToken()
    const interval = setInterval(refreshToken, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [getIdToken])

  // Heartbeat: update lastHeartbeat every 60s so cleanup Lambda knows we're alive
  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(async () => {
      try {
        await api.updateSession(sessionId, { lastHeartbeat: new Date().toISOString() }, getIdToken)
      } catch {}
    }, 60_000)
    return () => clearInterval(interval)
  }, [sessionId, getIdToken])

  // Auto-end session on tab close / navigation away
  useEffect(() => {
    if (!sessionId) return

    function endSessionNow() {
      if (sessionEndedRef.current || !cachedTokenRef.current) return
      sessionEndedRef.current = true
      const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStart.getTime()) / 60000))
      const payload = JSON.stringify({
        endTime: new Date().toISOString(),
        durationMinutes,
        messageCount: transcript.length,
        status: 'completed',
      })
      const url = `${import.meta.env.VITE_API_URL}/sessions/${sessionId}`
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cachedTokenRef.current}`,
        },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    function handleBeforeUnload() {
      endSessionNow()
    }

    function handlePageHide(e: PageTransitionEvent) {
      if (!e.persisted) endSessionNow()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [sessionId, transcript.length])

  const MUSIC_VOL_IDLE    = 0.35
  const MUSIC_VOL_TALKING = 0.08

  useEffect(() => {
    const audio = musicRef.current
    if (!audio) return
    audio.volume = MUSIC_VOL_IDLE
    const tryPlay = () => audio.play().then(() => dbg('music playing')).catch((e) => dbg(`music blocked: ${e}`))
    tryPlay()
    const resume = () => { tryPlay(); document.removeEventListener('click', resume) }
    document.addEventListener('click', resume)
    return () => document.removeEventListener('click', resume)
  }, [])

  // Fade music volume when AI is talking
  useEffect(() => {
    const audio = musicRef.current
    if (!audio) return
    const target = appState === 'idle' ? MUSIC_VOL_IDLE : MUSIC_VOL_TALKING
    if (fadeRef.current !== null) clearInterval(fadeRef.current)
    const step = (target - audio.volume) / 20
    fadeRef.current = window.setInterval(() => {
      if (!audio) return
      const next = audio.volume + step
      if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
        audio.volume = target
        if (fadeRef.current !== null) clearInterval(fadeRef.current)
      } else {
        audio.volume = Math.max(0, Math.min(1, next))
      }
    }, 25)
    return () => { if (fadeRef.current !== null) clearInterval(fadeRef.current) }
  }, [appState])

  function handleSend() {
    const text = input.trim()
    if (!text || !connected) return
    const readyFiles = attachedFiles.filter(f => f.status === 'ready')
    send(text, readyFiles.length > 0 ? readyFiles.map(f => f.name) : undefined)
    setInput('')
    setAttachedFiles(prev => prev.filter(f => f.status === 'uploading'))
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function togglePause() {
    const audio = musicRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
      setPaused(false)
    } else {
      audio.pause()
      setPaused(true)
    }
  }



  async function toggleRecording() {
    dbg(`toggleRecording called, isRecording=${isRecording}, connected=${connected}`)
    if (isRecording) {
      dbg('stopping recorder')
      mediaRecorderRef.current?.stop()
      return
    }

    dbg('requesting getUserMedia')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      dbg('getUserMedia granted')
    } catch (e) {
      dbg(`getUserMedia error: ${e}`)
      alert('Microphone access denied.')
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    dbg(`using mimeType=${mimeType}`)
    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      dbg(`ondataavailable size=${e.data.size}`)
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      setIsRecording(false)
      dbg(`recorder stopped, chunks=${chunks.length}, connected=${connected}`)
      if (!connected) return
      const blob = new Blob(chunks, { type: mimeType })
      dbg(`uploading audio blob size=${blob.size}`)
      try {
        const { text } = await api.transcribeAudio(blob, getIdToken)
        dbg(`transcribed: ${text}`)
        console.log('[transcribe] heard:', text)
        if (text) {
          send(text)
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      } catch (e) {
        dbg(`transcribe error: ${e}`)
        console.error('[transcribe] error:', e)
      }
    }

    recorder.start()
    setIsRecording(true)
    dbg('recorder started')
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files
    if (!selectedFiles || !sessionId) return
    const newFiles = Array.from(selectedFiles)
    const startIdx = attachedFiles.length

    setAttachedFiles(prev => [
      ...prev,
      ...newFiles.map(f => ({ name: f.name, status: 'uploading' as const })),
    ])

    for (let i = 0; i < newFiles.length; i++) {
      try {
        const { uploadUrl } = await api.requestUpload(
          sessionId,
          { fileName: newFiles[i].name, contentType: newFiles[i].type || 'application/octet-stream' },
          getIdToken,
        )
        await api.uploadFileToS3(uploadUrl, newFiles[i])
        setAttachedFiles(prev => prev.map((f, j) =>
          j === startIdx + i ? { ...f, status: 'ready' } : f
        ))
      } catch {
        setAttachedFiles(prev => prev.map((f, j) =>
          j === startIdx + i ? { ...f, status: 'error' } : f
        ))
      }
    }

    api.processDocuments(sessionId, getIdToken).catch(() => {})
    e.target.value = ''
  }

  const statusLabel = !connected
    ? 'Connecting…'
    : appState === 'thinking'
    ? 'Thinking…'
    : appState === 'talking'
    ? 'Speaking…'
    : 'Listening…'

  return (
    <div className="h-screen flex flex-col bg-cream-100 font-instrument overflow-hidden">

      <audio ref={musicRef} src={MUSIC_URL} loop hidden />

      {/* Nav */}
      <nav className="h-20 px-[120px] flex items-center justify-between border-b border-cream-border-dark bg-white shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span onClick={onHome} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Home
          </span>
          <span onClick={onExit} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Dashboard
          </span>
          <span onClick={onSettings} className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors">
            Settings
          </span>
          <div className="w-10 h-10 rounded-full bg-indigo-bg border-2 border-indigo-light" />
        </div>
      </nav>

      {/* Session header */}
      <div className="px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-2xl text-indigo-dark">
            Study Session
          </h1>
          <div className="flex items-center gap-2 bg-card border border-card-border rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#C24B32] animate-pulse" />
            <span className="text-sm font-mono font-semibold text-indigo-dark tabular-nums">
              {String(Math.floor(elapsed / 3600)).padStart(2, '0')}:{String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowPostStudy(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C24B32] text-[#C24B32] text-sm font-semibold hover:bg-[#FFF0EB] transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current" />
          End Session
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex px-8 pb-6 gap-6 min-h-0">

        {/* Left — character */}
        <div className="flex-[60] flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center min-h-0 min-w-0">
            <div className="relative w-full h-full" style={{ maxWidth: 'calc((100vh - 200px) * 4/3)' }}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-900">
            <LofiBackground />
            <div
              className="absolute z-10 inset-0"
              style={{
                opacity:    DEV_OVERLAY ? 1 : (appState === 'idle' ? 0 : 1),
                transition: DEV_OVERLAY ? undefined : 'opacity 300ms ease',
              }}
            >
              <CharacterCanvas
                restSrc={REST_IMAGE}
                attentionSrc={ATTENTION_IMAGE}
                viseme={currentViseme}
                talking={appState === 'talking'}
                devOverlay={DEV_OVERLAY}
              />
            </div>

            {/* Status overlay — top left */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
              <div className="flex flex-col">
                <span className="text-white text-xs font-semibold leading-tight">Study Buddy</span>
                <span className="text-white/70 text-[11px] leading-tight">{statusLabel}</span>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-[#E11D48] hover:bg-[#be123c] shadow-[0_4px_24px_rgba(225,29,72,0.55)] animate-pulse'
                    : 'bg-indigo-light hover:bg-indigo shadow-[0_4px_20px_rgba(212,137,106,0.4)]'
                }`}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
            </div>
            </div>
          </div>
        </div>

        {/* Right — chat panel */}
        <div className="flex-[40] flex flex-col min-w-0 min-h-0">
          {/* Music bar */}
          <div className="shrink-0 flex items-center gap-3 bg-card border border-card-border rounded-2xl px-4 py-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-bg flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-indigo-dark block truncate">Lo-fi Study Beats</span>
              <span className="text-[11px] text-[#6B5B50]">{paused ? 'Paused' : 'Now Playing'}</span>
            </div>
            <button
              onClick={togglePause}
              className="w-9 h-9 rounded-full bg-indigo hover:bg-indigo-dark flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              title={paused ? 'Play' : 'Pause'}
            >
              {paused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1">
            {transcript.length === 0 ? (
              <p className="text-center text-ink-muted text-sm mt-12">
                Ask your study buddy anything…
              </p>
            ) : (
              transcript.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'buddy' ? (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="bg-white border border-cream-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-ink leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-gray-50 prose-pre:rounded-lg prose-code:text-indigo-dark prose-code:before:content-none prose-code:after:content-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-[11px] text-ink-muted">
                            {formatTime(sessionStart, i)}
                          </span>
                          {appState === 'talking' && i === transcript.length - 1 && (
                            <button
                              onClick={stopSpeaking}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cream-border-dark/50 hover:bg-cream-border-dark text-ink-secondary text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              <Square className="w-2.5 h-2.5 fill-current" />
                              Stop
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[85%]">
                          {msg.attachments.map((name, j) => (
                            <span key={j} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-bg border border-indigo-light/20 rounded-lg text-xs text-indigo-dark">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[140px]">{name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="bg-indigo-bg border border-indigo-light/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-ink leading-relaxed max-w-[85%]">
                        {msg.text}
                      </div>
                      <span className="text-[11px] text-ink-muted pr-1">
                        {formatTime(sessionStart, i)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {appState === 'thinking' && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2 bg-white border border-cream-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:300ms]" />
                  </div>
                  <ThinkingTimer />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="pt-4 shrink-0">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {attachedFiles.map((file, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-bg border border-indigo-light/20 rounded-lg text-xs font-medium text-indigo-dark">
                    {file.status === 'uploading' ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo animate-spin" />
                    ) : file.status === 'ready' ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    {file.status !== 'uploading' && (
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="text-ink-muted hover:text-ink-secondary ml-0.5 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 bg-white border border-cream-border rounded-2xl px-4 py-3">
              <button
                className={`transition-colors cursor-pointer shrink-0 ${attachedFiles.some(f => f.status === 'uploading') ? 'text-indigo animate-pulse' : 'text-ink-muted hover:text-ink-secondary'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                className="flex-1 text-sm text-ink placeholder-ink-muted outline-none bg-transparent min-w-0"
                placeholder={connected ? 'Message StudyMate...' : 'Connecting…'}
                value={input}
                disabled={!connected}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                className="w-9 h-9 rounded-full bg-indigo hover:bg-indigo-dark disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                disabled={!connected || !input.trim()}
                onClick={handleSend}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {DEBUG && (
        <div className="shrink-0 px-4 py-2 bg-black/90 text-green-400 text-[11px] font-mono flex flex-col gap-1 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-4 text-white/60 shrink-0">
            <span>ws:{connected ? <span className="text-green-400">connected</span> : <span className="text-red-400">disconnected</span>}</span>
            <span>appState:{appState}</span>
            <span>isRecording:{String(isRecording)}</span>
            <button
              className="border border-white/30 px-2 py-0.5 rounded text-white/80 hover:text-white cursor-pointer"
              onClick={() => {
                const a = musicRef.current
                if (!a) return dbg('no audio element')
                dbg(`audio: paused=${a.paused} muted=${a.muted} readyState=${a.readyState}`)
                a.play().then(() => dbg('manual play OK')).catch((e) => dbg(`manual play failed: ${e}`))
              }}
            >test audio</button>
            <button
              className="border border-white/30 px-2 py-0.5 rounded text-white/80 hover:text-white cursor-pointer"
              onClick={() => dbg('ping')}
            >ping</button>
          </div>
          {debugLog.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}


{showPostStudy && (
        <PostStudyModal
          onClose={() => setShowPostStudy(false)}
          onBackToDashboard={async () => {
            sessionEndedRef.current = true
            if (sessionId) {
              const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStart.getTime()) / 60000))
              try {
                await api.updateSession(sessionId, {
                  endTime: new Date().toISOString(),
                  durationMinutes,
                  messageCount: transcript.length,
                  status: 'completed',
                  transcript: transcript.map((m) => ({ role: m.role, text: m.text })),
                }, getIdToken)
              } catch (e) {
                console.error('Failed to save session:', e)
              }
            }
            onExit()
          }}
          onGenerateSummary={async () => {
            if (!sessionId || generatingSummary || transcript.length === 0) return
            setGeneratingSummary(true)
            try {
              await api.updateSession(sessionId, {
                transcript: transcript.map((m) => ({ role: m.role, text: m.text })),
              }, getIdToken)
              const { summary } = await api.generateSummary(sessionId, getIdToken)
              setGeneratedSummary(summary)
            } catch (e) {
              console.error('Failed to generate summary:', e)
            } finally {
              setGeneratingSummary(false)
            }
          }}
          generatingSummary={generatingSummary}
          generatedSummary={generatedSummary}
          stats={{
            timeStudied: `${Math.max(1, Math.round((Date.now() - sessionStart.getTime()) / 60000))} min`,
            messages: transcript.length,
            topicsCount: Math.max(1, Math.floor(transcript.length / 3)),
          }}
        />
      )}
    </div>
  )
}

function ThinkingTimer() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  if (seconds < 2) return null
  return <span className="text-xs text-ink-muted tabular-nums">{seconds}s</span>
}

function formatTime(_sessionStart: Date, _index: number): string {
  const now = new Date()
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
