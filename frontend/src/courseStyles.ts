import {
  Binary,
  FlaskRound,
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  binary: Binary,
  'flask-round': FlaskRound,
  'bar-chart-3': BarChart3,
  'book-open': BookOpen,
  brain: Brain,
  'file-text': FileText,
}

export const DEFAULT_ICON = BookOpen

export interface CourseColorSet {
  bg: string
  border: string
  text: string
  iconBg: string
}

export const COLOR_MAP: Record<string, CourseColorSet> = {
  '#C24B32': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#C24B32]', iconBg: 'bg-white/70' },
  '#C06A45': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#C06A45]', iconBg: 'bg-white/70' },
  '#A67C52': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#A67C52]', iconBg: 'bg-white/70' },
  '#6B8C5A': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#6B8C5A]', iconBg: 'bg-white/70' },
  '#7A6352': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#7A6352]', iconBg: 'bg-white/70' },
  '#8B6B61': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#8B6B61]', iconBg: 'bg-white/70' },
  '#9C8B7E': { bg: 'bg-[#ECF0EB]', border: 'border-[#CDD6CC]', text: 'text-[#7A7067]', iconBg: 'bg-white/70' },
}

const DEFAULT_COLORS: CourseColorSet = {
  bg: 'bg-[#ECF0EB]',
  border: 'border-[#CDD6CC]',
  text: 'text-[#7A7067]',
  iconBg: 'bg-white/70',
}

export function getColorSet(hex: string): CourseColorSet {
  return COLOR_MAP[hex] || DEFAULT_COLORS
}
