'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useCredentials } from '@/contexts/CredentialsContext'
import { trHeaders } from '@/lib/testrail/credentials'
import TestCaseList from '@/components/tests/TestCaseList'
import ProgressBar from '@/components/ui/ProgressBar'
import Breadcrumb from '@/components/layout/Breadcrumb'
import HtmlContent from '@/components/ui/HtmlContent'
import Spinner from '@/components/ui/Spinner'
import { computePassRate } from '@/lib/utils/status'
import { formatDateTime } from '@/lib/utils/format'
import type { Result, TestWithResult, Run, Project, User } from '@/lib/testrail/types'

export default function RunPage() {
  const { projectId, runId } = useParams<{ projectId: string; runId: string }>()
  const pid = Number(projectId)
  const rid = Number(runId)
  const { credentials } = useCredentials()

  const [project, setProject] = useState<Project | null>(null)
  const [run, setRun] = useState<Run | null>(null)
  const [testsWithResults, setTestsWithResults] = useState<TestWithResult[]>([])
  const [usersMap, setUsersMap] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!credentials) return
    setLoading(true)
    setError(null)

    const h = trHeaders(credentials)
    Promise.all([
      fetch(`/api/testrail/projects/${pid}`, { headers: h }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/testrail/runs/${rid}`, { headers: h }).then((r) => r.json()),
      fetch(`/api/testrail/runs/${rid}/tests`, { headers: h }).then((r) => r.json()),
      fetch(`/api/testrail/runs/${rid}/results`, { headers: h }).then((r) => r.json()),
      fetch(`/api/testrail/users`, { headers: h }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([projectData, runData, tests, results, users]: [Project | null, Run, unknown[], Result[], User[]]) => {
        setProject(projectData)
        setRun(runData)

        const latestResultMap = new Map<number, Result>()
        for (const result of results) {
          if (!latestResultMap.has(result.test_id)) {
            latestResultMap.set(result.test_id, result)
          }
        }

        setTestsWithResults(
          (tests as TestWithResult[]).map((test) => ({
            ...test,
            latestResult: latestResultMap.get(test.id) ?? null,
          }))
        )

        setUsersMap(new Map(users.map((u) => [u.id, u.name])))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [credentials, pid, rid])

  const handleExport = useCallback(async () => {
    if (!credentials || !run) return
    setExporting(true)
    try {
      const res = await fetch(`/api/export/run/${rid}`, { headers: trHeaders(credentials) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const cd = res.headers.get('content-disposition') ?? ''
      const match = cd.match(/filename="([^"]+)"/)
      a.download = match ? match[1] : `run-${rid}.html`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : '匯出失敗')
    } finally {
      setExporting(false)
    }
  }, [credentials, run, rid])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">載入失敗：{error ?? '找不到此 Run'}</p>
      </div>
    )
  }

  const { passRate } = computePassRate(run)

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/' },
          { label: project?.name ?? `Project ${pid}`, href: `/projects/${pid}` },
          { label: run.name },
        ]}
      />

      {/* Run header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{run.name}</h1>
              {run.url && (
                <a
                  href={run.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 bg-blue-50 hover:bg-blue-100 transition-colors mt-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  TestRail
                </a>
              )}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full px-2 py-0.5 bg-gray-50 hover:bg-gray-100 transition-colors mt-0.5 disabled:opacity-50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exporting ? '匯出中...' : '匯出 HTML'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              建立於 {formatDateTime(run.created_on)}
              {run.is_completed && (
                <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  已完成
                </span>
              )}
              {run.refs && (
                <span className="ml-2 text-xs text-gray-500 font-medium">
                  Refs: {run.refs}
                </span>
              )}
            </p>
            {run.description && (
              <HtmlContent html={run.description} className="text-sm text-gray-600 mt-2" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-700 shrink-0">
            {passRate}%
          </div>
        </div>
        <ProgressBar
          passed={run.passed_count}
          failed={run.failed_count}
          blocked={run.blocked_count}
          untested={run.untested_count}
          retest={run.retest_count}
          showLabels
        />
      </div>

      {/* Test case list with interactive filter tabs */}
      <TestCaseList tests={testsWithResults} usersMap={usersMap} />
    </div>
  )
}
