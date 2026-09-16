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

export function useStudyBuddy(): StudyBuddyState {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const destroyed = useRef(false)
  const [connected, setConnected] = useState(false)
  const [appState, setAppState] = useState<AppState>('idle')
  const [transcript, setTranscript] = useState<StudyBuddyState['transcript']>([])
  const [currentViseme, setCurrentViseme] = useState('sil')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const visemeTimers = useRef<number[]>([])

  const connect = useCallback(() => {
    if (!WS_URL || destroyed.current) return

    const socket = new WebSocket(WS_URL)
    ws.current = socket

    socket.onopen = () => {
      setConnected(true)
    }

    socket.onclose = () => {
      setConnected(false)
      if (!destroyed.current) {
        reconnectTimer.current = window.setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    socket.onerror = () => {
      // onclose fires after onerror, so reconnect logic lives there
      socket.close()
    }

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'thinking') {
        setAppState('thinking')
      } else if (msg.type === 'response') {
        setTranscript((prev) => [...prev, { role: 'buddy', text: msg.text }])
        playResponse(msg.audio_b64, msg.visemes)
      }
    }
  }, [])

  useEffect(() => {
    destroyed.current = false
    connect()
    return () => {
      destroyed.current = true
      if (reconnectTimer.current !== null) clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  function playResponse(audio_b64: string, visemes: Viseme[]) {
    visemeTimers.current.forEach(clearTimeout)
    visemeTimers.current = []

    const blob = new Blob(
      [Uint8Array.from(atob(audio_b64), (c) => c.charCodeAt(0))],
      { type: 'audio/mpeg' }
    )
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audioRef.current = audio

    setAppState('talking')

    visemes.forEach((v) => {
      const id = window.setTimeout(() => setCurrentViseme(v.value), v.time)
      visemeTimers.current.push(id)
    })

    audio.onended = () => {
      setAppState('idle')
      setCurrentViseme('sil')
      URL.revokeObjectURL(url)
    }

    audio.play()
  }

  const send = useCallback((text: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return
    setTranscript((prev) => [...prev, { role: 'user', text }])
    ws.current.send(JSON.stringify({ action: 'message', text }))
  }, [])

  return { appState, transcript, currentViseme, send, connected }
}
