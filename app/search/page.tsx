'use client'

import { useEffect, useState, Suspense } from 'react'
import { useCredentials } from '@/contexts/CredentialsContext'
import { trHeaders } from '@/lib/testrail/credentials'
import SearchBar from '@/components/search/SearchBar'
import SearchResults from '@/components/search/SearchResults'
import Spinner from '@/components/ui/Spinner'

export default function SearchPage() {
  const { credentials } = useCredentials()
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    if (!credentials) return
    fetch('/api/testrail/projects', { headers: trHeaders(credentials) })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setProjects(data.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }))))
      .catch(() => null)
  }, [credentials])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">搜尋 Test Cases</h1>
        <p className="text-gray-500 mt-1">跨 Project 搜尋測試案例標題</p>
      </div>

      <div className="mb-6">
        <Suspense>
          <SearchBar projects={projects} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  )
}
