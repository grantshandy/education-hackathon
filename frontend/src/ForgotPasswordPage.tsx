import { useState } from 'react'
import { useAuth } from './AuthContext'
import { GraduationCap, Mail, Lock, KeyRound, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage({
  onDone,
  onBack,
}: {
  onDone: () => void
  onBack: () => void
}) {
  const { forgotPassword, forgotPasswordSubmit, error, clearError } = useAuth()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setStep('reset')
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!code || !newPassword) return
    setSubmitting(true)
    try {
      await forgotPasswordSubmit(email, code, newPassword)
      setSuccess(true)
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-cream-100 font-instrument">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo rounded-lg flex items-center justify-center">
              <GraduationCap className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-bold text-lg text-ink">StudyMate</span>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-ink">
              {success ? 'Password reset!' : step === 'email' ? 'Reset your password' : 'Enter new password'}
            </h2>
            <p className="text-ink-secondary text-sm mt-1">
              {success
                ? 'Your password has been changed. You can now sign in.'
                : step === 'email'
                  ? 'Enter your email and we\'ll send you a reset code.'
                  : `We sent a code to ${email}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {success ? (
          <button
            onClick={onDone}
            className="w-full h-12 bg-indigo hover:bg-indigo-dark text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Back to sign in <span>&rarr;</span>
          </button>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="email"
                  placeholder="you@utah.edu"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                  autoFocus
                  className="w-full h-12 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email}
              className="h-12 bg-indigo hover:bg-indigo-dark disabled:opacity-60 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send reset code <span>&rarr;</span></>}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="text-sm text-indigo font-semibold hover:underline cursor-pointer"
            >
              &larr; Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Verification code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); clearError() }}
                  autoFocus
                  className="w-full h-12 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink text-center tracking-[0.3em] font-mono placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); clearError() }}
                  className="w-full h-12 pl-10 pr-4 border border-cream-border rounded-lg text-sm text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || code.length < 6 || !newPassword}
              className="h-12 bg-indigo hover:bg-indigo-dark disabled:opacity-60 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Reset password <span>&rarr;</span></>}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="text-sm text-indigo font-semibold hover:underline cursor-pointer"
            >
              &larr; Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
