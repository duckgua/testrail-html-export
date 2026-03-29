'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { TestrailCredentials } from '@/lib/testrail/credentials'

const SESSION_KEY = 'tr_creds'
// HttpOnly cookie name — set/cleared via API route
const COOKIE_SET_API = '/api/session'

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

  async function setCredentials(creds: TestrailCredentials) {
    // Store in sessionStorage for React state (tab-scoped)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(creds))
    setCredentialsState(creds)
    // Also set an HttpOnly session cookie so image-proxy doesn't need URL params
    await fetch(COOKIE_SET_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    }).catch(() => null)
  }

  async function clearCredentials() {
    sessionStorage.removeItem(SESSION_KEY)
    setCredentialsState(null)
    // Clear the HttpOnly cookie
    await fetch(COOKIE_SET_API, { method: 'DELETE' }).catch(() => null)
  }

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
