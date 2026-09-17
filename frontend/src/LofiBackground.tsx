import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const BUCKET = 'https://education-hackathon-audio-247826798819.s3.amazonaws.com'

export const VIDEO_URL = `${BUCKET}/lofi-video.mp4`
export const MUSIC_URL = `${BUCKET}/lofi-music.mp3`

// ── Character overlay positioning ────────────────────────────────────────
// X, Y: % from top-left corner of video to top-left corner of the character
// CHAR_SCALE: character height as % of video height  (e.g. 60 = 60% tall)
export const CHAR_X     = 22.4  // % from left edge
export const CHAR_Y     = 3.3  // % from top edge
export const CHAR_SCALE = 93.0  // character height as % of video height

export const DEV_OVERLAY = false  // set true to show sliders + 50% opacity
// ─────────────────────────────────────────────────────────────────────────

export interface LofiBackgroundHandle {
  getVideo: () => HTMLVideoElement | null
}

export const LofiBackground = forwardRef<LofiBackgroundHandle>(function LofiBackground(_, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
  }))

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function seekToRandom() {
      if (!video || !video.duration || !isFinite(video.duration)) return
      video.currentTime = Math.random() * Math.max(0, video.duration - 10)
    }
    video.addEventListener('canplay', seekToRandom, { once: true })
    return () => video.removeEventListener('canplay', seekToRandom)
  }, [])

  return (
    <video
      ref={videoRef}
      src={VIDEO_URL}
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
})
