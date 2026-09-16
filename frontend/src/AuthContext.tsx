import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
          }) => void) => void
          renderButton: (element: HTMLElement, config: {
            type?: string
            theme?: string
            size?: string
            text?: string
            logo_alignment?: string
            width?: number
          }) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

interface User {
  email: string
  name: string
  sub: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  googleReady: boolean
  loginWithGoogle: () => void
  renderGoogleButton: (element: HTMLElement) => void
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ needsConfirmation: boolean }>
  confirm: (email: string, code: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  forgotPasswordSubmit: (email: string, code: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  getIdToken: () => Promise<string | null>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [googleReady, setGoogleReady] = useState(false)
  const googleTokenRef = useRef<string | null>(null)
  const handleGoogleRef = useRef<((response: { credential: string }) => void) | undefined>(undefined)

  handleGoogleRef.current = (response) => {
    try {
      const payload = decodeJwtPayload(response.credential)
      setUser({
        email: payload.email ?? '',
        name: payload.name ?? '',
        sub: payload.sub ?? '',
      })
      googleTokenRef.current = response.credential
      localStorage.setItem('studymate_google_credential', response.credential)
      setLoading(false)
    } catch {
      setError('Failed to process Google sign-in.')
    }
  }

  useEffect(() => {
    async function init() {
      // Try restoring a Cognito session (email/password users)
      try {
        await getCurrentUser()
        const attrs = await fetchUserAttributes()
        setUser({
          email: attrs.email ?? '',
          name: attrs.name ?? '',
          sub: attrs.sub ?? '',
        })
        setLoading(false)
        return
      } catch {
        // No Cognito session
      }

      // Try restoring a Google session from localStorage
      const stored = localStorage.getItem('studymate_google_credential')
      if (stored) {
        try {
          const payload = decodeJwtPayload(stored)
          if (payload.exp * 1000 > Date.now()) {
            setUser({
              email: payload.email ?? '',
              name: payload.name ?? '',
              sub: payload.sub ?? '',
            })
            googleTokenRef.current = stored
          } else {
            localStorage.removeItem('studymate_google_credential')
          }
        } catch {
          localStorage.removeItem('studymate_google_credential')
        }
      }
      setLoading(false)
    }

    init()

    // Initialize Google Identity Services
    function initGIS() {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => handleGoogleRef.current?.(response),
      })
      setGoogleReady(true)
    }

    if (window.google?.accounts?.id) {
      initGIS()
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGIS()
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const renderGoogleButton = useCallback((element: HTMLElement) => {
    window.google?.accounts?.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      logo_alignment: 'center',
      width: 380,
    })
  }, [])

  function loginWithGoogle() {
    if (!window.google?.accounts?.id) {
      setError('Google sign-in is loading. Please try again.')
      return
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Google sign-in popup was blocked. Use the Google button below, or try email/password.')
      }
    })
  }

  async function login(email: string, password: string) {
    setError(null)
    try {
      const result = await amplifySignIn({ username: email, password })
      if (result.isSignedIn) {
        const attrs = await fetchUserAttributes()
        setUser({
          email: attrs.email ?? '',
          name: attrs.name ?? '',
          sub: attrs.sub ?? '',
        })
      }
    } catch (e: any) {
      const msg =
        e.name === 'NotAuthorizedException' || e.name === 'UserNotFoundException'
          ? 'Incorrect email or password.'
          : e.name === 'UserNotConfirmedException'
            ? 'Please verify your email first.'
            : e.message || 'Sign in failed.'
      setError(msg)
      throw e
    }
  }

  async function register(name: string, email: string, password: string) {
    setError(null)
    try {
      const result = await amplifySignUp({
        username: email,
        password,
        options: { userAttributes: { name, email } },
      })
      return { needsConfirmation: !result.isSignUpComplete }
    } catch (e: any) {
      const msg =
        e.name === 'UsernameExistsException'
          ? 'An account with this email already exists.'
          : e.message || 'Sign up failed.'
      setError(msg)
      throw e
    }
  }

  async function confirm(email: string, code: string) {
    setError(null)
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
    } catch (e: any) {
      const msg =
        e.name === 'CodeMismatchException'
          ? 'Invalid verification code.'
          : e.message || 'Confirmation failed.'
      setError(msg)
      throw e
    }
  }

  async function forgotPassword(email: string) {
    setError(null)
    try {
      await amplifyResetPassword({ username: email })
    } catch (e: any) {
      const msg =
        e.name === 'UserNotFoundException'
          ? 'No account found with this email.'
          : e.message || 'Failed to send reset code.'
      setError(msg)
      throw e
    }
  }

  async function forgotPasswordSubmit(email: string, code: string, newPassword: string) {
    setError(null)
    try {
      await amplifyConfirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      })
    } catch (e: any) {
      const msg =
        e.name === 'CodeMismatchException'
          ? 'Invalid verification code.'
          : e.name === 'InvalidPasswordException'
            ? 'Password does not meet requirements.'
            : e.message || 'Failed to reset password.'
      setError(msg)
      throw e
    }
  }

  async function logout() {
    try { await amplifySignOut() } catch {}
    googleTokenRef.current = null
    localStorage.removeItem('studymate_google_credential')
    window.google?.accounts?.id.disableAutoSelect()
    setUser(null)
  }

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()
      if (token) return token
    } catch {}
    return googleTokenRef.current
  }, [])

  function clearError() {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        googleReady,
        loginWithGoogle,
        renderGoogleButton,
        login,
        register,
        confirm,
        forgotPassword,
        forgotPasswordSubmit,
        logout,
        getIdToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
