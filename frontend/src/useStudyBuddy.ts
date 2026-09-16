import { useCallback, useEffect, useRef, useState } from 'react'

export type AppState = 'idle' | 'thinking' | 'talking'

export interface Viseme {
  time: number
  type: string
  value: string
}

export interface StudyBuddyState {
  appState: AppState
  transcript: { role: 'user' | 'buddy'; text: string }[]
  currentViseme: string
  send: (text: string) => void
  connected: boolean
}

const WS_URL = import.meta.env.VITE_WS_URL as string
const RECONNECT_DELAY_MS = 2000

export function useStudyBuddy(
  getToken?: () => Promise<string | null>
): StudyBuddyState {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const destroyed = useRef(false)
  const pendingMessages = useRef<string[]>([])
  const [connected, setConnected] = useState(false)
  const [appState, setAppState] = useState<AppState>('idle')
  const [transcript, setTranscript] = useState<StudyBuddyState['transcript']>([])
  const [currentViseme, setCurrentViseme] = useState('sil')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const visemeTimers = useRef<number[]>([])

  const connect = useCallback(async () => {
    if (!WS_URL || destroyed.current) return

    let url = WS_URL
    if (getToken) {
      const token = await getToken()
      if (token) {
        url = `${WS_URL}?token=${encodeURIComponent(token)}`
      }
    }

    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      setConnected(true)
      const queued = pendingMessages.current.splice(0)
      queued.forEach((msg) => socket.send(msg))
    }

    socket.onclose = () => {
      setConnected(false)
      if (!destroyed.current) {
        reconnectTimer.current = window.setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    socket.onerror = () => {
      // onclose fires automatically after onerror; reconnect logic lives there
    }

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      console.log('[ws] message:', msg.type, msg.audio_url ? `audio_url=${msg.audio_url.slice(0,80)}...` : 'no audio_url')
      if (msg.type === 'thinking') {
        setAppState('thinking')
      } else if (msg.type === 'response') {
        setTimeout(
          () => setTranscript((prev) => [...prev, { role: 'buddy', text: msg.text }]),
          1650,
        )
        playResponse(msg.audio_url, msg.visemes)
      }
    }
  }, [getToken])

  useEffect(() => {
    destroyed.current = false
    connect()
    return () => {
      destroyed.current = true
      if (reconnectTimer.current !== null) clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  function stopAudio() {
    visemeTimers.current.forEach(clearTimeout)
    visemeTimers.current = []
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current = null
    }
    setCurrentViseme('sil')
  }

  async function playResponse(audioUrl: string, visemes: Viseme[]) {
    console.log('[audio] playResponse called, url:', audioUrl?.slice(0, 80))
    stopAudio()

    // Start transition animation immediately while audio fetches in parallel
    const TRANSITION_DELAY_MS = 1650
    setAppState('talking')

    let objectUrl: string
    try {
      const res = await fetch(audioUrl, { mode: 'cors' })
      const blob = await res.blob()
      objectUrl = URL.createObjectURL(blob)
    } catch (e) {
      console.error('[audio] fetch error:', e)
      setAppState('idle')
      return
    }

    const audio = new Audio(objectUrl)
    audio.onerror = (e) => console.error('[audio] load error:', e, audio.error)
    audioRef.current = audio

    visemes.forEach((v) => {
      const id = window.setTimeout(
        () => setCurrentViseme(v.value),
        v.time + TRANSITION_DELAY_MS,
      )
      visemeTimers.current.push(id)
    })

    audio.onended = () => {
      setAppState('idle')
      setCurrentViseme('sil')
      URL.revokeObjectURL(objectUrl)
    }

    const playId = window.setTimeout(() => audio.play(), TRANSITION_DELAY_MS)
    visemeTimers.current.push(playId)
  }

  const send = useCallback((text: string) => {
    stopAudio()
    setAppState('thinking')
    setTranscript((prev) => [...prev, { role: 'user', text }])
    const payload = JSON.stringify({ action: 'message', text })
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(payload)
    } else {
      pendingMessages.current.push(payload)
    }
  }, [])

  return { appState, transcript, currentViseme, send, connected }
}
