import { useRef, useState } from 'react'
import { useStudyBuddy } from './useStudyBuddy'

// Simple mouth shape → emoji/label mapping — swap for sprite frames later
const VISEME_MOUTH: Record<string, string> = {
  sil: '😶', p: '😮', t: '😬', S: '😯', T: '😬',
  f: '😬', k: '😮', i: '😁', r: '😮', s: '😯',
  u: '😮', '@': '😮', a: '😮', e: '😁', E: '😁',
  o: '😮', O: '😮',
}

export default function App() {
  const { appState, transcript, currentViseme, send, connected } = useStudyBuddy()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  function handleSend() {
    const text = input.trim()
    if (!text || appState !== 'idle') return
    send(text)
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const stateLabel = !connected
    ? 'Connecting…'
    : appState === 'thinking'
    ? 'Thinking…'
    : appState === 'talking'
    ? 'Speaking…'
    : 'Listening'

  const mouth = VISEME_MOUTH[currentViseme] ?? '😶'

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-between p-4 gap-4">

      {/* Character */}
      <div className="flex flex-col items-center gap-2 pt-8">
        <div className="text-8xl select-none" aria-hidden>
          {appState === 'idle' || appState === 'thinking' ? '🧑‍💻' : mouth}
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          appState === 'talking' ? 'bg-purple-700' :
          appState === 'thinking' ? 'bg-yellow-700' :
          connected ? 'bg-green-800' : 'bg-gray-700'
        }`}>
          {stateLabel}
        </span>
      </div>

      {/* Transcript */}
      <div className="w-full max-w-xl flex-1 overflow-y-auto flex flex-col gap-3 py-4">
        {transcript.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-8">
            Ask your study buddy anything…
          </p>
        )}
        {transcript.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-purple-700 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-100 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="w-full max-w-xl flex gap-2 pb-4">
        <input
          className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-600"
          placeholder={connected ? 'Ask something…' : 'Connecting…'}
          value={input}
          disabled={!connected || appState !== 'idle'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          disabled={!connected || appState !== 'idle' || !input.trim()}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  )
}
