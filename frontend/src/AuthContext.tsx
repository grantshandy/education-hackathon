import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  signInWithRedirect,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

interface User {
  email: string
  name: string
  sub: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  loginWithGoogle: () => void
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ needsConfirmation: boolean }>
  confirm: (email: string, code: string) => Promise<void>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const isOAuthCallback = window.location.search.includes('code=')

    const unsubscribe = Hub.listen('auth', async ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        try {
          const attrs = await fetchUserAttributes()
          setUser({
            email: attrs.email ?? '',
            name: attrs.name ?? '',
            sub: attrs.sub ?? '',
          })
        } catch {
          setUser(null)
        }
        window.history.replaceState({}, '', window.location.pathname)
        setLoading(false)
      }
      if (payload.event === 'signInWithRedirect_failure') {
        setUser(null)
        setLoading(false)
      }
    })

    if (isOAuthCallback) {
      // Don't check auth yet — wait for Hub to fire after code exchange
    } else {
      checkAuth()
    }

    return unsubscribe
  }, [])

  async function checkAuth() {
    try {
      await getCurrentUser()
      const attrs = await fetchUserAttributes()
      setUser({
        email: attrs.email ?? '',
        name: attrs.name ?? '',
        sub: attrs.sub ?? '',
      })
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
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

  async function logout() {
    await amplifySignOut()
    setUser(null)
  }

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession()
      return session.tokens?.idToken?.toString() ?? null
    } catch {
      return null
    }
  }, [])

  function loginWithGoogle() {
    signInWithRedirect({ provider: 'Google' })
  }

  function clearError() {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithGoogle,
        login,
        register,
        confirm,
        logout,
        getIdToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
