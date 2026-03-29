'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCredentials } from '@/contexts/CredentialsContext'
import { trHeaders } from '@/lib/testrail/credentials'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import type { SearchResult } from '@/app/api/testrail/search/route'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const projectId = searchParams.get('projectId') ?? ''
  const { credentials } = useCredentials()

  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query.length < 3 || !credentials) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({ q: query })
    if (projectId) params.set('projectId', projectId)

    fetch(`/api/testrail/search?${params}`, { headers: trHeaders(credentials) })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setResults(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [query, projectId, credentials])

  if (query.length > 0 && query.length < 3) {
    return <p className="text-sm text-gray-400 text-center py-8">請輸入至少 3 個字元</p>
  }

  if (!query) {
    return <p className="text-sm text-gray-400 text-center py-8">輸入關鍵字開始搜尋</p>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
        <Spinner />
        搜尋中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm">搜尋失敗：{error}</p>
      </div>
    )
  }

  if (results.length === 0) {
    return <EmptyState message={`沒有找到符合「${query}」的 Test Case`} icon="🔍" />
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">找到 {results.length} 個結果</p>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {results.map((result, i) => (
          <Link
            key={`${result.caseId}-${i}`}
            href={`/projects/${result.projectId}`}
            className="block px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors group"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 mb-1">
              {result.title}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-blue-500 font-medium">
                <span>●</span>
                {result.projectName}
              </span>
              <span>/ {result.suiteName}</span>
              {result.sectionName !== '—' && <span>/ {result.sectionName}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
