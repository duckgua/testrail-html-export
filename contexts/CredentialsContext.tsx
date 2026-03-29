'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { TestrailCredentials } from '@/lib/testrail/credentials'

const SESSION_KEY = 'tr_creds'

interface CredentialsContextValue {
  credentials: TestrailCredentials | null
  setCredentials: (creds: TestrailCredentials) => void
  clearCredentials: () => void
}

const CredentialsContext = createContext<CredentialsContextValue | null>(null)

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentialsState] = useState<TestrailCredentials | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        setCredentialsState(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  function setCredentials(creds: TestrailCredentials) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(creds))
    setCredentialsState(creds)
  }

  function clearCredentials() {
    sessionStorage.removeItem(SESSION_KEY)
    setCredentialsState(null)
  }

  // Avoid rendering children before hydration to prevent sessionStorage mismatch
  if (!hydrated) return null

  return (
    <CredentialsContext.Provider value={{ credentials, setCredentials, clearCredentials }}>
      {children}
    </CredentialsContext.Provider>
  )
}

export function useCredentials(): CredentialsContextValue {
  const ctx = useContext(CredentialsContext)
  if (!ctx) throw new Error('useCredentials must be used within CredentialsProvider')
  return ctx
}
