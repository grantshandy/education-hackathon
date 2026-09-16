import { type LucideIcon } from 'lucide-react'
import {
  GraduationCap,
  ArrowLeft,
  Pencil,
  Play,
  Clock,
  FileText,
  BarChart3,
  Flame,
  ChevronDown,
  Plus,
  MoreVertical,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

interface CourseColor {
  bg: string
  border: string
  text: string
  iconBg: string
}

const COURSE_COLORS: Record<string, CourseColor> = {
  red: {
    bg: 'bg-[#FFF1F2]',
    border: 'border-[#FFE4E6]',
    text: 'text-[#E11D48]',
    iconBg: 'bg-[#FFF1F2]',
  },
  blue: {
    bg: 'bg-[#F0F9FF]',
    border: 'border-[#E0F2FE]',
    text: 'text-[#0369A1]',
    iconBg: 'bg-[#F0F9FF]',
  },
  green: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#DCFCE7]',
    text: 'text-[#15803D]',
    iconBg: 'bg-[#F0FDF4]',
  },
  yellow: {
    bg: 'bg-[#FEFCE8]',
    border: 'border-[#FEF9C3]',
    text: 'text-[#A16207]',
    iconBg: 'bg-[#FEFCE8]',
  },
  purple: {
    bg: 'bg-[#FAF5FF]',
    border: 'border-[#F3E8FF]',
    text: 'text-[#6D28D9]',
    iconBg: 'bg-[#FAF5FF]',
  },
}

const SAMPLE_SESSIONS = [
  {
    month: 'SEP',
    day: 16,
    title: 'Dijkstra & Shortest Paths',
    topics: ['Shortest paths', "Dijkstra's algorithm", 'Graphs'],
    duration: '42 min',
  },
  {
    month: 'SEP',
    day: 14,
    title: 'Dynamic Programming',
    topics: ['Memoization', 'Optimal substructure', 'Knapsack'],
    duration: '55 min',
  },
  {
    month: 'SEP',
    day: 12,
    title: 'Graph Traversal',
    topics: ['BFS', 'DFS', 'Connected components'],
    duration: '28 min',
  },
  {
    month: 'SEP',
    day: 10,
    title: 'Sorting Algorithms',
    topics: ['Merge sort', 'Quick sort', 'Time complexity'],
    duration: '37 min',
  },
]

const SAMPLE_MATERIALS = [
  { name: 'Lecture 1 - Introduction.pdf', type: 'PDF', size: '2.4 MB' },
  { name: 'Lecture 2 - Graphs.pdf', type: 'PDF', size: '3.1 MB' },
  { name: 'Homework 1 Solutions.pdf', type: 'PDF', size: '1.8 MB' },
  { name: 'Midterm Review Notes.pdf', type: 'PDF', size: '2.6 MB' },
  { name: 'Algorithms Cheatsheet.pdf', type: 'PDF', size: '1.2 MB' },
]

const STATS = [
  { icon: Clock, value: '6h 42m', label: 'Total Study Time', color: 'text-indigo' },
  { icon: FileText, value: '4', label: 'Study Sessions', color: 'text-indigo' },
  { icon: BarChart3, value: '48 min', label: 'Average Session', color: 'text-indigo' },
  { icon: Flame, value: '4 days', label: 'Study Streak', color: 'text-amber-500' },
]

export default function CoursePage({
  courseName = 'Algorithms',
  courseIcon,
  color = 'red',
  materials = 8,
  sessions = 4,
  onBack,
  onStartSession,
}: {
  courseName?: string
  courseIcon?: LucideIcon
  color?: keyof typeof COURSE_COLORS
  materials?: number
  sessions?: number
  onBack: () => void
  onStartSession: () => void
}) {
  const c = COURSE_COLORS[color] ?? COURSE_COLORS.red
  const Icon = courseIcon ?? FileText

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col font-instrument">
      {/* Nav */}
      <nav className="h-20 px-[120px] flex items-center justify-between border-b border-cream-border-dark bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-[15px] font-medium text-indigo-dark cursor-pointer">
            Home
          </span>
          <span className="text-[15px] font-medium text-[#5C5A80] cursor-pointer hover:text-indigo-dark transition-colors">
            Settings
          </span>
          <div className="w-9 h-9 rounded-full bg-cream-border-dark" />
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-[120px] pt-8 pb-20 flex flex-col gap-8">
        {/* Back link */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-indigo-dark hover:text-indigo transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Course header */}
        <div className="flex items-center gap-5">
          <div
            className={`w-16 h-16 rounded-2xl ${c.iconBg} border ${c.border} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-7 h-7 ${c.text}`} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-[28px] text-indigo-dark">
              {courseName}
            </h1>
            <p className="text-sm text-[#5C5A80]">
              {materials} materials · {sessions} study sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 border border-cream-border-dark rounded-lg text-sm font-medium text-indigo-dark hover:bg-cream-100 transition-colors cursor-pointer">
              <Pencil className="w-3.5 h-3.5" />
              Edit Course
            </button>
            <button
              onClick={onStartSession}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-dark hover:bg-indigo text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Start Study Session
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex-1 flex items-center gap-4 px-6 py-5 bg-white border border-cream-border-dark rounded-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-bg flex items-center justify-center shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <span className="font-bold text-2xl text-indigo-dark block">
                  {stat.value}
                </span>
                <span className="text-sm text-[#5C5A80]">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Study Sessions */}
        <section className="flex flex-col gap-4 bg-white border border-cream-border-dark rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl text-indigo-dark">
              Study Sessions
            </h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-cream-border-dark rounded-lg text-sm text-[#5C5A80] hover:bg-cream-100 transition-colors cursor-pointer">
              Most Recent
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-cream-border-dark">
            {SAMPLE_SESSIONS.map((session) => (
              <div
                key={session.title}
                className="flex items-center gap-5 py-4"
              >
                <div className="w-14 h-14 rounded-xl bg-indigo-bg flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-indigo uppercase leading-none">
                    {session.month}
                  </span>
                  <span className="text-lg font-bold text-indigo-dark leading-tight">
                    {session.day}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-[15px] text-indigo-dark block">
                    {session.title}
                  </span>
                  <span className="text-sm text-[#5C5A80]">
                    {session.topics.join(' · ')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9A98B0]" />
                    <span className="text-sm text-[#5C5A80]">
                      {session.duration}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-cream-border-dark rounded-lg text-sm font-medium text-[#5C5A80] hover:text-indigo-dark hover:border-indigo/30 transition-colors cursor-pointer">
                    View Summary
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="flex items-center justify-center gap-1.5 text-sm text-[#5C5A80] hover:text-indigo-dark transition-colors cursor-pointer pt-1">
            Load more sessions
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Course Materials */}
        <section className="flex flex-col gap-4 bg-white border border-cream-border-dark rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl text-indigo-dark">
              Course Materials
            </h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-cream-border-dark rounded-lg text-sm font-medium text-[#5C5A80] hover:text-indigo-dark transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              Add Material
            </button>
          </div>

          <div className="flex flex-col divide-y divide-cream-border-dark">
            {SAMPLE_MATERIALS.map((material) => (
              <div
                key={material.name}
                className="flex items-center gap-4 py-3.5"
              >
                <div className={`w-9 h-9 rounded-lg ${c.iconBg} border ${c.border} flex items-center justify-center shrink-0`}>
                  <FileText className={`w-4 h-4 ${c.text}`} />
                </div>
                <span className="flex-1 text-sm font-medium text-indigo-dark">
                  {material.name}
                </span>
                <span className="text-sm text-[#9A98B0]">
                  {material.type} · {material.size}
                </span>
                <button className="text-[#9A98B0] hover:text-indigo-dark transition-colors cursor-pointer p-1">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button className="flex items-center justify-center gap-1.5 text-sm font-medium text-indigo hover:text-indigo-dark transition-colors cursor-pointer pt-1">
            View all materials
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </main>
    </div>
  )
}
