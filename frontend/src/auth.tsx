import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from './api'

type User = {
  id: string
  email: string
  createdAt: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'applyflow.token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    return window.localStorage.getItem(STORAGE_KEY)
  })
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    let isActive = true
    setIsLoading(true)

    api.getMe(token)
      .then((result) => {
        if (isActive) {
          setUser({
            id: result.id,
            email: result.email,
            createdAt: result.createdAt
          })
        }
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [token])

  async function login(email: string, password: string) {
    const response = await api.login({ email, password })
    window.localStorage.setItem(STORAGE_KEY, response.token)
    setToken(response.token)
    setUser({ id: response.userId, email: response.email, createdAt: response.createdAt })
  }

  async function register(email: string, password: string) {
    const response = await api.register({ email, password })
    window.localStorage.setItem(STORAGE_KEY, response.token)
    setToken(response.token)
    setUser({ id: response.userId, email: response.email, createdAt: response.createdAt })
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout
    }),
    [user, token, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
