import { useState } from 'react'
import { GraduationCap, User, Volume2, Bell, Moon, LogOut } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'

export default function SettingsPage({
  onHome,
  onDashboard,
  onLogout,
}: {
  onHome?: () => void
  onDashboard?: () => void
  onLogout?: () => void
}) {
  const { user } = useAuth()
  const { darkMode, setDarkMode } = useTheme()
  const [musicVolume, setMusicVolume] = useState(35)
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col font-instrument">
      <nav className="h-20 px-[120px] flex items-center justify-between border-b border-cream-border-dark bg-white shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
          <div className="w-8 h-8 bg-indigo rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-indigo-dark">StudyMate</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors" onClick={onHome}>
            Home
          </span>
          <span className="text-[15px] font-medium text-ink-secondary cursor-pointer hover:text-ink transition-colors" onClick={onDashboard}>
            Dashboard
          </span>
          <span className="text-[15px] font-semibold text-indigo-light cursor-pointer">
            Settings
          </span>
          <div className="w-10 h-10 rounded-full bg-indigo-bg border-2 border-indigo-light flex items-center justify-center">
            <span className="text-sm font-bold text-indigo">
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-[120px] pt-10 pb-20">
        <h1 className="font-gabarito font-bold text-[32px] text-ink mb-8">Settings</h1>

        <div className="flex flex-col gap-6 max-w-2xl">
          {/* Profile */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <User className="w-5 h-5 text-indigo" />
              <h2 className="font-bold text-lg text-ink">Profile</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-bg border-2 border-indigo-light flex items-center justify-center">
                <span className="text-xl font-bold text-indigo">
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-ink">{user?.email || 'Not signed in'}</p>
                <p className="text-sm text-ink-muted">StudyMate Member</p>
              </div>
            </div>
          </div>

          {/* Study Preferences */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Volume2 className="w-5 h-5 text-indigo" />
              <h2 className="font-bold text-lg text-ink">Study Preferences</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">Default Music Volume</p>
                <p className="text-sm text-ink-muted">Set your preferred lo-fi music volume</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-32 accent-indigo"
                />
                <span className="text-sm font-medium text-ink-secondary w-8">{musicVolume}%</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Bell className="w-5 h-5 text-indigo" />
              <h2 className="font-bold text-lg text-ink">Notifications</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">Session Reminders</p>
                <p className="text-sm text-ink-muted">Get reminded to take study breaks</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${notifications ? 'bg-indigo' : 'bg-cream-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Moon className="w-5 h-5 text-indigo" />
              <h2 className="font-bold text-lg text-ink">Appearance</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">Dark Mode</p>
                <p className="text-sm text-ink-muted">Switch to a darker study theme</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${darkMode ? 'bg-indigo' : 'bg-cream-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Sign Out */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-6 hover:border-[#C24B32]/40 transition-colors cursor-pointer w-full text-left"
            >
              <LogOut className="w-5 h-5 text-[#C24B32]" />
              <span className="font-semibold text-[#C24B32]">Sign Out</span>
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
