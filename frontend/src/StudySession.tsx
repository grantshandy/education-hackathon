import { useRef, useState } from 'react'
import { useStudyBuddy } from './useStudyBuddy'
import { CharacterCanvas } from './CharacterCanvas'

const CHARACTER_IMAGE = '/character.jpg'

export default function StudySession({ onExit }: { onExit: () => void }) {
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

  const statusLabel = !connected
    ? 'Connecting…'
    : appState === 'thinking'
    ? 'Thinking…'
    : appState === 'talking'
    ? 'Speaking…'
    : 'Listening'

  const statusColor =
    appState === 'talking'  ? 'bg-purple-700' :
    appState === 'thinking' ? 'bg-yellow-700' :
    connected               ? 'bg-green-800'  : 'bg-gray-700'

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex overflow-hidden">

      {/* ── Left: character ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 min-w-0">

        {/* Header */}
        <div className="w-full flex items-center justify-between shrink-0">
          <button
            onClick={onExit}
            className="text-gray-400 hover:text-gray-200 text-sm flex items-center gap-1 transition-colors"
          >
            <span>&larr;</span> Home
          </button>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Character canvas */}
        <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
          <CharacterCanvas
            imageSrc={CHARACTER_IMAGE}
            viseme={currentViseme}
            talking={appState === 'talking'}
          />
        </div>
      </div>

      {/* ── Right: chat panel ── */}
      <div className="w-80 shrink-0 flex flex-col border-l border-gray-800 bg-gray-900">

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
          {transcript.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mt-8">
              Ask your study buddy anything…
            </p>
          ) : (
            transcript.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-purple-700 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-800 flex gap-2">
          <input
            className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-600 min-w-0"
            placeholder={connected ? 'Ask something…' : 'Connecting…'}
            value={input}
            disabled={!connected || appState !== 'idle'}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0"
            disabled={!connected || appState !== 'idle' || !input.trim()}
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
