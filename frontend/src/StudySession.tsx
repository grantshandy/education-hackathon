import { useEffect, useRef, useState } from 'react'
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
  Video,
  Settings,
  Paperclip,
  ArrowUp,
  Square,
  ExternalLink,
  Minus,
} from 'lucide-react'

const REST_IMAGE      = '/studying.png'
const ATTENTION_IMAGE = '/at-attention.jpg'

export default function StudySession({ sessionId, onExit }: { sessionId: string | null; onExit: () => void }) {
  const { getIdToken } = useAuth()
  const { appState, transcript, currentViseme, send, connected } = useStudyBuddy(getIdToken)
  const [input, setInput] = useState('')
  const [charX, setCharX] = useState(CHAR_X)
  const [charY, setCharY] = useState(CHAR_Y)
  const [charScale, setCharScale] = useState(CHAR_SCALE)
  const activeX = DEV_OVERLAY ? charX : CHAR_X
  const activeY = DEV_OVERLAY ? charY : CHAR_Y
  const activeScale = DEV_OVERLAY ? charScale : CHAR_SCALE
  const [showPostStudy, setShowPostStudy] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [muted, setMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  function dbg(msg: string) {
    if (!DEBUG) return
    const ts = new Date().toISOString().slice(11, 23)
    console.log(`[debug ${ts}]`, msg)
    setDebugLog((prev) => [...prev.slice(-49), `${ts} ${msg}`])
  }
  const musicRef = useRef<HTMLAudioElement>(null)
  const fadeRef = useRef<number | null>(null)
  const [sessionStart] = useState(() => new Date())

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
    send(text)
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function toggleMute() {
    const audio = musicRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
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

  const statusLabel = !connected
    ? 'Connecting…'
    : appState === 'thinking'
    ? 'Thinking…'
    : appState === 'talking'
    ? 'Speaking…'
    : 'Listening…'

  const startTime = sessionStart.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="h-screen flex flex-col bg-cream-100 font-instrument overflow-hidden">

      <audio ref={musicRef} src={MUSIC_URL} loop hidden />

      {/* Nav */}
      <nav className="h-16 px-8 flex items-center justify-between border-b border-cream-border bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-lg text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-[15px] font-medium text-indigo-dark cursor-pointer">
            Home
          </span>
          <span className="text-[15px] font-medium text-[#5C5A80] cursor-pointer">
            Settings
          </span>
          <button
            onClick={toggleMute}
            className="text-[#5C5A80] hover:text-indigo-dark transition-colors text-lg"
            title={muted ? 'Unmute music' : 'Mute music'}
          >
            {muted ? '🔇' : '🎵'}
          </button>
          <div className="w-9 h-9 rounded-full bg-cream-border-dark" />
        </div>
      </nav>

      {/* Session header */}
      <div className="px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-bold text-2xl text-indigo-dark">
            Study Session
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#E11D48]" />
            <span className="text-sm text-[#5C5A80]">
              Started {startTime}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowPostStudy(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E11D48] text-[#E11D48] text-sm font-semibold hover:bg-[#FFF1F2] transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current" />
          End Session
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex px-8 pb-6 gap-6 min-h-0">

        {/* Left — character */}
        <div className="flex-[55] flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center min-h-0 min-w-0">
            <div className="relative w-full h-full" style={{ maxWidth: 'calc((100vh - 200px) * 4/3)' }}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-900">
            <LofiBackground />
            <div
              className="absolute z-10"
              style={{
                left:       `${activeX}%`,
                top:        `${activeY}%`,
                height:     `${activeScale}%`,
                width:      'auto',
                opacity:    DEV_OVERLAY ? 0.5 : (appState === 'idle' ? 0 : 1),
                transition: DEV_OVERLAY ? undefined : 'opacity 300ms ease',
              }}
            >
              <CharacterCanvas
                restSrc={REST_IMAGE}
                attentionSrc={ATTENTION_IMAGE}
                viseme={currentViseme}
                talking={appState === 'talking'}
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

            {/* Top right icons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
              <button className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer">
                <ExternalLink className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer">
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
              <button className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-gray-700/80 transition-colors cursor-pointer">
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-[#E11D48] hover:bg-[#be123c] shadow-[0_4px_24px_rgba(225,29,72,0.55)] animate-pulse'
                    : 'bg-indigo-light hover:bg-indigo shadow-[0_4px_20px_rgba(129,140,248,0.4)]'
                }`}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-gray-700/80 transition-colors cursor-pointer">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            </div>
            </div>
          </div>
        </div>

        {/* Right — chat panel */}
        <div className="flex-[45] flex flex-col min-w-0 min-h-0">
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
                        <div className="bg-white border border-cream-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-ink leading-relaxed">
                          {msg.text}
                        </div>
                        <span className="text-[11px] text-ink-muted pl-1">
                          {formatTime(sessionStart, i)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
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
              <div className="flex items-center gap-1 px-2 py-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="pt-4 shrink-0">
            <div className="flex items-center gap-3 bg-white border border-cream-border rounded-2xl px-4 py-3">
              <button className="text-ink-muted hover:text-ink-secondary transition-colors cursor-pointer shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
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

      {DEV_OVERLAY && (
        <div className="shrink-0 px-8 py-3 bg-black/80 text-white text-xs flex items-center gap-6 font-mono">
          <span className="text-white/50">overlay</span>
          <label className="flex items-center gap-2">
            X <span className="w-12 text-right">{charX.toFixed(1)}%</span>
            <input type="range" min={0} max={100} step={0.1} value={charX} onChange={e => setCharX(Number(e.target.value))} className="w-32" />
          </label>
          <label className="flex items-center gap-2">
            Y <span className="w-12 text-right">{charY.toFixed(1)}%</span>
            <input type="range" min={0} max={100} step={0.1} value={charY} onChange={e => setCharY(Number(e.target.value))} className="w-32" />
          </label>
          <label className="flex items-center gap-2">
            H% <span className="w-12 text-right">{charScale.toFixed(1)}%</span>
            <input type="range" min={1} max={100} step={0.1} value={charScale} onChange={e => setCharScale(Number(e.target.value))} className="w-32" />
          </label>
          <span className="text-yellow-300 select-all">CHAR_X={charX.toFixed(1)} CHAR_Y={charY.toFixed(1)} CHAR_SCALE={charScale.toFixed(1)}</span>
        </div>
      )}

{showPostStudy && (
        <PostStudyModal
          onClose={() => setShowPostStudy(false)}
          onBackToDashboard={async () => {
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

function formatTime(_sessionStart: Date, _index: number): string {
  const now = new Date()
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
