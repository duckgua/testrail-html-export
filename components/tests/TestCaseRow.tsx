'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import HtmlContent from '@/components/ui/HtmlContent'
import StepExpander from './StepExpander'
import { useCredentials } from '@/contexts/CredentialsContext'
import { trHeaders } from '@/lib/testrail/credentials'
import type { TestWithResult, Case } from '@/lib/testrail/types'

interface TestCaseRowProps {
  test: TestWithResult
  usersMap?: Map<number, string>
}

export default function TestCaseRow({ test, usersMap = new Map() }: TestCaseRowProps) {
  const { credentials } = useCredentials()
  const [isExpanded, setIsExpanded] = useState(false)
  const [caseDetail, setCaseDetail] = useState<Case | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExpand() {
    setIsExpanded((prev) => !prev)
    if (!isExpanded && !caseDetail && !isLoading) {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/testrail/cases/${test.case_id}`, {
          headers: credentials ? trHeaders(credentials) : {},
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setCaseDetail(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : '載入失敗')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const comment = test.latestResult?.comment
  const assigneeId = test.assignedto_id ?? test.latestResult?.assignedto_id
  const assigneeName = assigneeId
    ? (usersMap.get(assigneeId) ?? `User #${assigneeId}`)
    : null

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={handleExpand}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
      >
        <span className="mt-0.5 text-gray-400 shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge statusId={test.status_id} size="sm" />
            <span className="text-sm font-medium text-gray-900 break-words">{test.title}</span>
          </div>
          {comment && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              <HtmlContent html={comment} className="text-xs" />
            </div>
          )}
        </div>
        {assigneeName && (
          <span className="shrink-0 text-xs text-gray-400 mt-0.5 whitespace-nowrap">{assigneeName}</span>
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-10 bg-gray-50 border-t border-gray-100">
          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
              <Spinner size="sm" />
              載入測試步驟...
            </div>
          )}
          {error && (
            <p className="py-3 text-sm text-red-600">載入失敗：{error}</p>
          )}
          {caseDetail && (
            <div className="pt-3">
              {comment && (
                <div className="mb-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-0.5">備註</p>
                  <HtmlContent html={comment} className="text-sm text-yellow-900" />
                </div>
              )}
              <StepExpander caseDetail={caseDetail} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
