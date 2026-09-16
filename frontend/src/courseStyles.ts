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
  '#E11D48': { bg: 'bg-[#FFF1F2]', border: 'border-[#FFE4E6]', text: 'text-[#E11D48]', iconBg: 'bg-white/70' },
  '#EA580C': { bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', text: 'text-[#EA580C]', iconBg: 'bg-white/70' },
  '#A16207': { bg: 'bg-[#FEFCE8]', border: 'border-[#FEF9C3]', text: 'text-[#A16207]', iconBg: 'bg-white/70' },
  '#15803D': { bg: 'bg-[#F0FDF4]', border: 'border-[#DCFCE7]', text: 'text-[#15803D]', iconBg: 'bg-white/70' },
  '#0369A1': { bg: 'bg-[#F0F9FF]', border: 'border-[#E0F2FE]', text: 'text-[#0369A1]', iconBg: 'bg-white/70' },
  '#6D28D9': { bg: 'bg-[#FAF5FF]', border: 'border-[#F3E8FF]', text: 'text-[#6D28D9]', iconBg: 'bg-white/70' },
  '#9CA3AF': { bg: 'bg-[#F9FAFB]', border: 'border-[#F3F4F6]', text: 'text-[#6B7280]', iconBg: 'bg-white/70' },
}

const DEFAULT_COLORS: CourseColorSet = {
  bg: 'bg-[#F9FAFB]',
  border: 'border-[#F3F4F6]',
  text: 'text-[#6B7280]',
  iconBg: 'bg-white/70',
}

export function getColorSet(hex: string): CourseColorSet {
  return COLOR_MAP[hex] || DEFAULT_COLORS
}
