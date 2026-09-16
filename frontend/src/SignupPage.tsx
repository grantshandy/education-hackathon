import { useState } from 'react'
import {
  GraduationCap,
  FileText,
  MessageSquare,
  BarChart3,
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Circle,
  CheckCircle2,
} from 'lucide-react'

const FEATURES = [
  { icon: FileText, title: 'Your materials, our AI', desc: 'Upload notes, slides, and more' },
  { icon: MessageSquare, title: 'Get instant, tailored help', desc: 'Answers based on your coursework' },
  { icon: BarChart3, title: 'Track your progress', desc: 'See your study habits and growth' },
  { icon: Sparkles, title: 'A more engaging experience', desc: 'Voice, chat, and customizable AI characters' },
]

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Includes a number', test: (p: string) => /\d/.test(p) },
  { label: 'Includes a letter', test: (p: string) => /[a-zA-Z]/.test(p) },
]

export default function SignupPage({
  onSignup,
  onSwitchToLogin,
  onBack,
}: {
  onSignup: () => void
  onSwitchToLogin: () => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSignup()
  }

  return (
    <div className="h-screen flex font-instrument">
      {/* Left — hero illustration */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="/lofi-hero.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-dark/90 via-indigo-dark/80 to-indigo-dark/70" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <span>&larr;</span>
            <GraduationCap className="w-6 h-6" />
            <span className="font-bold text-lg">StudyMate</span>
          </button>

          <div className="flex flex-col gap-8 max-w-md">
            <div>
              <h1 className="text-[44px] font-bold leading-tight">
                A smarter
                <br />
                way to study.
              </h1>
              <p className="text-white/70 text-lg mt-3">
                Upload your notes, ask questions, and study with AI — all in one
                place.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <div>
                    <p className="font-semibold text-[15px]">{f.title}</p>
                    <p className="text-white/60 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-sm italic">
            "Small progress every day adds up to big results."
          </p>
        </div>
      </div>

      {/* Right — signup form */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="flex justify-end px-6 pt-4 shrink-0">
          <span className="text-sm text-ink-secondary">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-indigo font-semibold hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="w-full max-w-sm flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="font-bold text-lg text-ink">StudyMate</span>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-ink">
                  Create your account
                </h2>
                <p className="text-ink-secondary text-sm mt-1">
                  Start your personalized study journey.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Steven Luo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="email"
                    placeholder="you@utah.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-12 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = password.length > 0 && rule.test(password)
                    return (
                      <div
                        key={rule.label}
                        className="flex items-center gap-2 text-xs"
                      >
                        {passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-ink-muted" />
                        )}
                        <span
                          className={
                            passed ? 'text-green-600' : 'text-ink-muted'
                          }
                        >
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="h-11 bg-indigo hover:bg-indigo-dark text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer mt-1"
              >
                Sign up <span>&rarr;</span>
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-cream-border" />
              <span className="text-xs text-ink-muted">or</span>
              <div className="flex-1 h-px bg-cream-border" />
            </div>

            <button className="flex items-center justify-center gap-3 h-11 border border-cream-border rounded-lg text-sm font-medium text-ink hover:bg-cream-50 transition-colors cursor-pointer">
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-xs text-ink-muted text-center">
              By creating an account, you agree to our{' '}
              <span className="text-indigo cursor-pointer">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-indigo cursor-pointer">Privacy Policy</span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}
