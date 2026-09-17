const BUCKET = 'https://education-hackathon-audio-247826798819.s3.amazonaws.com'

export const MUSIC_URL = `${BUCKET}/lofi-music.mp3`

// ── Character overlay positioning ────────────────────────────────────────
export const CHAR_X     = 22.4  // % from left edge
export const CHAR_Y     = 3.3  // % from top edge
export const CHAR_SCALE = 93.0  // character height as % of video height

export const DEV_OVERLAY = false  // set true to show character position sliders
export const DEBUG = false        // set true to show WS status panel and log events
// ─────────────────────────────────────────────────────────────────────────

export interface LofiBackgroundHandle {
  getVideo: () => HTMLVideoElement | null
}

export function LofiBackground() {
  return (
    <img
      src="/sprites/lofi-girl-loop.gif"
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}
