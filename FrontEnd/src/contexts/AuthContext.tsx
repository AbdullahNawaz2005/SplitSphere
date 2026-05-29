import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, ApiUser, tokenStore } from '../services/api'
import { authService, LoginRequest, RegisterRequest } from '../services/authService'

interface AuthContextValue {
  user: ApiUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (body: LoginRequest) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const messageFor = (error: unknown) => {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(() => tokenStore.getUser())
  const [loading, setLoading] = useState(() => Boolean(tokenStore.getToken()))

  useEffect(() => {
    const token = tokenStore.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    authService
      .me()
      .then((currentUser) => {
        tokenStore.setUser(currentUser)
        setUser(currentUser)
      })
      .catch(() => {
        tokenStore.clearAll()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const listener = () => setUser(null)
    window.addEventListener('splitsphere:unauthorized', listener)
    return () => window.removeEventListener('splitsphere:unauthorized', listener)
  }, [])

  const login = useCallback(async (body: LoginRequest) => {
    try {
      const response = await authService.login(body)
      setUser(response.user)
    } catch (error) {
      throw new Error(messageFor(error))
    }
  }, [])

  const register = useCallback(async (body: RegisterRequest) => {
    try {
      const response = await authService.register(body)
      setUser(response.user)
    } catch (error) {
      throw new Error(messageFor(error))
    }
  }, [])

  const googleLogin = useCallback(async (idToken: string) => {
    try {
      const response = await authService.googleLogin({ idToken })
      setUser(response.user)
    } catch (error) {
      throw new Error(messageFor(error))
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && tokenStore.getToken()),
      login,
      register,
      googleLogin,
      logout,
    }),
    [googleLogin, loading, login, logout, register, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
