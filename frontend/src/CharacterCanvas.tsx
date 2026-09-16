import { useEffect, useRef, useState } from 'react'

type SpriteManifest = Record<string, string>

const TRANSITION_MS = 1650
const FADE_MS = 80
const IDLE_CYCLE_MS = 3200

type CharState = 'idle' | 'transitioning_in' | 'talking' | 'transitioning_out'

interface Props {
  restSrc: string
  attentionSrc: string
  viseme: string
  talking: boolean
}

export function CharacterCanvas({ restSrc, attentionSrc, viseme, talking }: Props) {
  const [manifest, setManifest] = useState<SpriteManifest | null>(null)
  const [charState, setCharState] = useState<CharState>('idle')

  // Two sprite layers — back fades out while front fades in (no unmount flicker)
  const [frontSrc, setFrontSrc] = useState(restSrc)
  const [backSrc, setBackSrc]   = useState(restSrc)
  const [frontOpacity, setFrontOpacity] = useState(1)

  // GIF layer — separate so remounting it doesn't affect sprite layers
  const [gifSrc, setGifSrc]       = useState<string | null>(null)
  const [gifVisible, setGifVisible] = useState(false)
  // Increment to force GIF img remount (restarts animation) without touching sprites
  const [gifKey, setGifKey] = useState(0)

  const transitionTimer = useRef<number | null>(null)
  const idleTimer       = useRef<number | null>(null)
  const idleIndex       = useRef(0)
  const talkingRef      = useRef(talking)
  const charStateRef    = useRef(charState)
  const fadingRef       = useRef(false)

  useEffect(() => { talkingRef.current  = talking   }, [talking])
  useEffect(() => { charStateRef.current = charState }, [charState])

  useEffect(() => {
    fetch('/sprites/manifest.json')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: SpriteManifest) => setManifest(d))
      .catch(() => {})
  }, [])

  function spriteFor(v: string) {
    return manifest?.[v] ?? attentionSrc
  }

  function crossfadeTo(next: string) {
    if (fadingRef.current) return
    fadingRef.current = true
    // next image loads into back layer
    setBackSrc(next)
    // fade front out so back shows through
    setFrontOpacity(0)
    setTimeout(() => {
      // promote back → front so it stays visible after opacity resets
      setFrontSrc(next)
      setFrontOpacity(1)
      fadingRef.current = false
    }, FADE_MS)
  }

  function playGif(src: string) {
    setGifSrc(src)
    setGifKey(k => k + 1)  // remount only the GIF img
    setGifVisible(true)
  }

  function hideGif() {
    setGifVisible(false)
  }

  function clearTransitionTimer() {
    if (transitionTimer.current !== null) {
      clearTimeout(transitionTimer.current)
      transitionTimer.current = null
    }
  }

  // Main state machine
  useEffect(() => {
    clearTransitionTimer()

    if (talking) {
      setCharState('transitioning_in')
      playGif('/sprites/transition_in.gif')
      transitionTimer.current = window.setTimeout(() => {
        hideGif()
        if (talkingRef.current) {
          setCharState('talking')
          crossfadeTo(spriteFor('sil'))
        } else {
          setCharState('transitioning_out')
          playGif('/sprites/transition_out.gif')
          transitionTimer.current = window.setTimeout(() => {
            hideGif()
            setCharState('idle')
            crossfadeTo(restSrc)
          }, TRANSITION_MS)
        }
      }, TRANSITION_MS)
    } else {
      const cur = charStateRef.current
      if (cur === 'talking' || cur === 'transitioning_in') {
        setCharState('transitioning_out')
        playGif('/sprites/transition_out.gif')
        transitionTimer.current = window.setTimeout(() => {
          hideGif()
          setCharState('idle')
          crossfadeTo(restSrc)
        }, TRANSITION_MS)
      }
    }

    return clearTransitionTimer
  }, [talking])

  // Viseme crossfades — only while in talking state
  useEffect(() => {
    if (charState === 'talking' && manifest) {
      crossfadeTo(spriteFor(viseme))
    }
  }, [viseme, charState, manifest])

  // Idle sway loop
  useEffect(() => {
    if (idleTimer.current !== null) { clearInterval(idleTimer.current); idleTimer.current = null }
    if (charState !== 'idle' || !manifest?.['idle_1']) return
    idleTimer.current = window.setInterval(() => {
      idleIndex.current = (idleIndex.current + 1) % 2
      const s = manifest[`idle_${idleIndex.current + 1}`]
      if (s) crossfadeTo(s)
    }, IDLE_CYCLE_MS)
    return () => { if (idleTimer.current !== null) clearInterval(idleTimer.current) }
  }, [charState, manifest])

  return (
    <div className="relative max-h-full max-w-full flex items-center justify-center">

      {/* Back sprite layer — fades in beneath front */}
      <img
        src={backSrc}
        alt=""
        aria-hidden
        className="absolute inset-0 max-h-full max-w-full object-contain"
        style={{ opacity: 1 }}
      />

      {/* Front sprite layer — fades out to reveal back */}
      <img
        src={frontSrc}
        alt="study buddy"
        className="absolute inset-0 max-h-full max-w-full object-contain"
        style={{ opacity: frontOpacity, transition: `opacity ${FADE_MS}ms linear` }}
      />

      {/* GIF transition layer — sits on top, hidden when not playing */}
      {gifSrc && (
        <img
          key={gifKey}
          src={gifSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 max-h-full max-w-full object-contain"
          style={{
            opacity: gifVisible ? 1 : 0,
            transition: 'opacity 80ms linear',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Invisible sizing element so the container takes correct dimensions */}
      <img src={restSrc} alt="" aria-hidden className="max-h-full max-w-full object-contain invisible" />
    </div>
  )
}
