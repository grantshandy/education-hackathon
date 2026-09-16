export default function HomePage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* Nav */}
      <nav className="w-full px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-purple-400">Study</span>Buddy
        </span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <div className="text-[7rem] leading-none select-none" aria-hidden>🧑‍💻</div>

        <div className="flex flex-col gap-4 max-w-lg">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Study with an AI<br />
            <span className="text-purple-400">classmate</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Upload your lecture notes, hit start, and study alongside an AI that
            already understands your material. Ask questions by voice or text — like
            having a smart friend right next to you.
          </p>
        </div>

        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-500 text-white text-lg font-medium px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
        >
          Start Study Session
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {[
            ['🎙️', 'Voice chat'],
            ['📄', 'Upload notes'],
            ['🎵', 'Lo-fi vibes'],
            ['💬', 'Text chat'],
          ].map(([icon, label]) => (
            <span
              key={label}
              className="flex items-center gap-2 bg-gray-800/60 text-gray-300 text-sm px-4 py-2 rounded-full"
            >
              <span>{icon}</span> {label}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-600 text-xs">
        Built for learning, not lecturing.
      </footer>
    </div>
  )
}
