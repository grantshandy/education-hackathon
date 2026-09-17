import { useEffect, useRef, useState } from 'react'

const FADE_MS = 80

type CharState = 'idle' | 'transitioning_in' | 'talking' | 'transitioning_out'

interface MouthPosition {
  left: number
  top: number
  width: number
  height: number
}

interface Props {
  restSrc: string
  attentionSrc: string
  viseme: string
  talking: boolean
  devOverlay?: boolean
}

export function CharacterCanvas({ attentionSrc, viseme, talking, devOverlay }: Props) {
  const [spriteMap, setSpriteMap] = useState<Record<string, string>>({})
  const [mouthPos, setMouthPos] = useState<MouthPosition | null>(null)
  const [mouthUrls, setMouthUrls] = useState<string[]>([])
  const [charState, setCharState] = useState<CharState>('idle')
  const [activeViseme, setActiveViseme] = useState('sil')

  const transInRef = useRef<HTMLVideoElement>(null)
  const transOutRef = useRef<HTMLVideoElement>(null)
  const talkingRef = useRef(talking)
  const charStateRef = useRef(charState)

  useEffect(() => { talkingRef.current = talking }, [talking])
  useEffect(() => { charStateRef.current = charState }, [charState])

  useEffect(() => {
    fetch('/sprites/manifest.json')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Record<string, unknown>) => {
        if (data.mouthPosition) setMouthPos(data.mouthPosition as MouthPosition)

        const sprites: Record<string, string> = {}
        const urls = new Set<string>()
        for (const [k, v] of Object.entries(data)) {
          if (k !== 'mouthPosition' && typeof v === 'string') {
            sprites[k] = v
            urls.add(v)
          }
        }
        setSpriteMap(sprites)
        setMouthUrls(Array.from(urls))
      })
      .catch(() => {})
  }, [])

  function spriteFor(v: string): string {
    return spriteMap[v] ?? spriteMap['sil'] ?? ''
  }

  function playVideo(ref: React.RefObject<HTMLVideoElement | null>) {
    const vid = ref.current
    if (!vid) return false
    vid.currentTime = 0
    vid.play().catch(() => {})
    return true
  }

  useEffect(() => {
    if (talking) {
      setCharState('transitioning_in')
      if (!playVideo(transInRef)) {
        setCharState('talking')
        setActiveViseme('sil')
      }
    } else {
      const cur = charStateRef.current
      if (cur === 'talking' || cur === 'transitioning_in') {
        setCharState('transitioning_out')
        if (!playVideo(transOutRef)) {
          setCharState('idle')
        }
      }
    }
  }, [talking])

  function handleTransInEnded() {
    if (talkingRef.current) {
      setCharState('talking')
      setActiveViseme('sil')
    } else {
      setCharState('transitioning_out')
      if (!playVideo(transOutRef)) {
        setCharState('idle')
      }
    }
  }

  function handleTransOutEnded() {
    setCharState('idle')
  }

  useEffect(() => {
    if (Object.keys(spriteMap).length === 0) return
    if (charState === 'talking') {
      setActiveViseme(viseme)
    } else if (charState === 'transitioning_in' && viseme !== 'sil') {
      setCharState('talking')
      setActiveViseme(viseme)
    }
  }, [viseme, charState, spriteMap])

  const isTalking = charState === 'talking' || !!devOverlay
  const activeUrl = spriteFor(activeViseme)

  return (
    <div className="absolute inset-0">

      {/* Base layer: at-attention face shown during talking */}
      <img
        src={attentionSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: isTalking ? 1 : 0,
          transition: `opacity ${FADE_MS}ms linear`,
          pointerEvents: 'none',
        }}
      />

      {/* Mouth sprites — cropped and positioned if mouthPosition exists */}
      {mouthPos ? (
        <div
          className="absolute"
          style={{
            left: `${mouthPos.left}%`,
            top: `${mouthPos.top}%`,
            width: `${mouthPos.width}%`,
            height: `${mouthPos.height}%`,
            pointerEvents: 'none',
          }}
        >
          {mouthUrls.map(url => (
            <img
              key={url}
              src={url}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'fill',
                opacity: isTalking && url === activeUrl ? 1 : 0,
                transition: `opacity ${FADE_MS}ms linear`,
              }}
            />
          ))}
        </div>
      ) : (
        mouthUrls.map(url => (
          <img
            key={url}
            src={url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: isTalking && url === activeUrl ? 1 : 0,
              transition: `opacity ${FADE_MS}ms linear`,
              pointerEvents: 'none',
            }}
          />
        ))
      )}

      {/* Transition in: studying → looking at camera */}
      <video
        ref={transInRef}
        src="/sprites/transition_in.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={handleTransInEnded}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: charState === 'transitioning_in' ? 1 : 0,
          pointerEvents: 'none',
        }}
      />

      {/* Transition out: looking at camera → studying */}
      <video
        ref={transOutRef}
        src="/sprites/transition_out.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={handleTransOutEnded}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: charState === 'transitioning_out' ? 1 : 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
