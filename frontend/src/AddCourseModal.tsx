import { useState } from 'react'
import { X } from 'lucide-react'

const COLORS = [
  { name: 'terracotta', value: '#C24B32' },
  { name: 'amber', value: '#C06A45' },
  { name: 'caramel', value: '#A67C52' },
  { name: 'sage', value: '#6B8C5A' },
  { name: 'walnut', value: '#7A6352' },
  { name: 'rosewood', value: '#8B6B61' },
  { name: 'stone', value: '#9C8B7E' },
]

export default function AddCourseModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, color: string) => void
}) {
  const [courseName, setCourseName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)

  function handleCreate() {
    const name = courseName.trim()
    if (!name) return
    onCreate(name, selectedColor)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-instrument"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[rgba(10,9,21,0.55)]" />

      <div
        className="relative w-[560px] bg-cream-100 border border-cream-border-dark rounded-3xl p-8 shadow-[0_16px_32px_rgba(10,9,21,0.1)] flex flex-col gap-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-bold text-2xl text-indigo-dark">Add Course</h2>
            <p className="text-sm text-[#6B5B50] leading-relaxed">
              Create a new course folder to organize your study sessions and
              materials.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[rgba(233,231,224,0.5)] flex items-center justify-center shrink-0 cursor-pointer hover:bg-cream-border transition-colors"
          >
            <X className="w-3.5 h-3.5 text-ink-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#6B5B50]">
              Course Name
            </label>
            <input
              type="text"
              placeholder="e.g. Algorithms, Organic Chemistry, US History"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="h-12 px-4 border border-cream-muted rounded-[10px] bg-white text-sm text-indigo-dark placeholder-[#6B5B50] outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-[#6B5B50]">
              Folder Color
            </label>
            <div className="flex gap-4">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className="w-11 h-11 rounded-full cursor-pointer transition-all"
                  style={{
                    backgroundColor: color.value + '25',
                    boxShadow:
                      selectedColor === color.value
                        ? `0 0 0 2px white, 0 0 0 4px ${color.value}`
                        : 'none',
                  }}
                >
                  <span
                    className="block w-full h-full rounded-full"
                    style={{ backgroundColor: color.value + '40' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="text-[15px] font-semibold text-[#6B5B50] hover:text-indigo-dark transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!courseName.trim()}
            className="px-6 py-3 bg-indigo hover:bg-indigo-dark disabled:opacity-40 text-white font-semibold text-[15px] rounded-full transition-colors cursor-pointer shadow-[0_4px_12px_rgba(192,106,69,0.15)]"
          >
            Create Course
          </button>
        </div>
      </div>
    </div>
  )
}
