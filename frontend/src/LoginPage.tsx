import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  GraduationCap,
  Upload,
  Sparkles,
  BarChart3,
  Users,
  Mail,
  Lock,
  Loader2,
} from 'lucide-react'

const FEATURES = [
  { icon: Upload, title: 'Upload your notes', desc: 'PDFs, slides, and more' },
  { icon: Sparkles, title: 'Get personalized help', desc: 'Answers tailored to your classes' },
  { icon: BarChart3, title: 'Track your progress', desc: 'See your study habits and growth' },
  { icon: Users, title: 'Study your way', desc: 'Voice, chat, and customizable AI characters' },
]

export default function LoginPage({
  onLogin,
  onSwitchToSignup,
  onForgotPassword,
  onBack,
}: {
  onLogin: () => void
  onSwitchToSignup: () => void
  onForgotPassword: () => void
  onBack: () => void
}) {
  const { login, error, clearError, googleReady, renderGoogleButton } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (googleReady && googleBtnRef.current) {
      renderGoogleButton(googleBtnRef.current)
    }
  }, [googleReady, renderGoogleButton])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    try {
      await login(email, password)
      onLogin()
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
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

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
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
                Study smarter,
                <br />
                together.
              </h1>
              <p className="text-white/70 text-lg mt-3">
                Your AI study buddy, anytime, anywhere.
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

          <div />
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex justify-end p-6">
          <span className="text-sm text-ink-secondary">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-indigo font-semibold hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm flex flex-col gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="font-bold text-lg text-ink">StudyMate</span>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-ink">Welcome back</h2>
                <p className="text-ink-secondary text-sm mt-1">
                  Sign in to continue your study journey.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div
                ref={googleBtnRef}
                className="flex items-center justify-center h-12"
              />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-cream-border" />
                <span className="text-xs text-ink-muted">or</span>
                <div className="flex-1 h-px bg-cream-border" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="email"
                      placeholder="you@utah.edu"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        clearError()
                      }}
                      className="w-full h-12 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-ink">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-xs font-semibold text-indigo hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        clearError()
                      }}
                      className="w-full h-12 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 bg-indigo hover:bg-indigo-dark disabled:opacity-60 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign in <span>&rarr;</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-xs text-ink-muted text-center">
              By continuing, you agree to our{' '}
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

