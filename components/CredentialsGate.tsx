'use client'

import { useCredentials } from '@/contexts/CredentialsContext'
import CredentialsForm from './CredentialsForm'

export default function CredentialsGate({ children }: { children: React.ReactNode }) {
  const { credentials } = useCredentials()
  if (!credentials) return <CredentialsForm />
  return <>{children}</>
}
