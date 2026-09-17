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

export function CharacterCanvas({ viseme, talking, devOverlay }: Props) {
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

  // In dev mode, seek transition_in to its last frame so the talking pose is visible
  useEffect(() => {
    if (!devOverlay) return
    const vid = transInRef.current
    if (!vid) return
    const seekToEnd = () => { vid.currentTime = vid.duration }
    if (vid.readyState >= 1) seekToEnd()
    else vid.addEventListener('loadedmetadata', seekToEnd, { once: true })
  }, [devOverlay])

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
    // Pause on the last frame — video stays visible while charState === 'talking'
    if (transInRef.current) transInRef.current.pause()
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
    <>
    {devOverlay && mouthPos && (
      <div className="absolute top-2 left-2 z-50 bg-black/70 text-white text-xs p-2 rounded flex flex-col gap-1" style={{ pointerEvents: 'all' }}>
        {(['left', 'top', 'width', 'height'] as const).map(key => (
          <label key={key} className="flex items-center gap-2">
            <span className="w-12">{key}</span>
            <input
              type="range"
              min={key === 'width' || key === 'height' ? 1 : 0}
              max={key === 'width' || key === 'height' ? 30 : 100}
              step={0.1}
              value={mouthPos[key]}
              onChange={e => setMouthPos(prev => prev ? { ...prev, [key]: parseFloat(e.target.value) } : prev)}
              className="w-32"
            />
            <span className="w-10 text-right">{mouthPos[key].toFixed(1)}</span>
          </label>
        ))}
        <button
          className="mt-1 text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-0.5"
          onClick={() => navigator.clipboard.writeText(JSON.stringify(mouthPos, null, 2))}
        >
          Copy JSON
        </button>
      </div>
    )}
    <div className="absolute inset-0">

      {/* Transition in: studying → looking at camera, then holds last frame while talking */}
      <video
        ref={transInRef}
        src="/sprites/transition_in.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={handleTransInEnded}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: devOverlay || charState === 'transitioning_in' || charState === 'talking' || charState === 'transitioning_out' ? 1 : 0,
          pointerEvents: 'none',
        }}
      />

      {/* Mouth sprites overlaid on the held last frame */}
      {mouthPos && (
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
                objectFit: 'contain',
                opacity: isTalking && url === activeUrl ? 1 : 0,
                transition: `opacity ${FADE_MS}ms linear`,
              }}
            />
          ))}
        </div>
      )}

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
    </>
  )
}
