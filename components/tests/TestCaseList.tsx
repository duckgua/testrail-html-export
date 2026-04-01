'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TestCaseRow from './TestCaseRow'
import type { TestWithResult } from '@/lib/testrail/types'

type FilterKey = 'all' | 'passed' | 'failed' | 'blocked' | 'untested'

interface FilterTab {
  key: FilterKey
  label: string
  statusId?: number
  count: number
}

interface TestCaseListProps {
  tests: TestWithResult[]
  usersMap?: Map<number, string>
  statusesMap?: Map<number, string>
}

export default function TestCaseList({ tests, usersMap = new Map(), statusesMap }: TestCaseListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const counts = {
    all: tests.length,
    passed: tests.filter((t) => t.status_id === 1).length,
    failed: tests.filter((t) => t.status_id === 5).length,
    blocked: tests.filter((t) => t.status_id === 2).length,
    untested: tests.filter((t) => t.status_id === 3).length,
  }

  const tabs: FilterTab[] = [
    { key: 'all', label: '全部', count: counts.all },
    { key: 'passed', label: 'Passed', statusId: 1, count: counts.passed },
    { key: 'failed', label: 'Failed', statusId: 5, count: counts.failed },
    { key: 'blocked', label: 'Blocked', statusId: 2, count: counts.blocked },
    { key: 'untested', label: 'Untested', statusId: 3, count: counts.untested },
  ]

  const filtered =
    activeFilter === 'all'
      ? tests
      : tests.filter((t) => {
          if (activeFilter === 'passed') return t.status_id === 1
          if (activeFilter === 'failed') return t.status_id === 5
          if (activeFilter === 'blocked') return t.status_id === 2
          if (activeFilter === 'untested') return t.status_id === 3
          return true
        })

  if (tests.length === 0) {
    return <EmptyState message="此 Run 沒有任何 Test Case" icon="📋" />
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {tab.statusId !== undefined && !isActive && (
                <Badge statusId={tab.statusId} size="sm" />
              )}
              {tab.label}
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Test Case List */}
      {filtered.length === 0 ? (
        <EmptyState message={`沒有 ${tabs.find((t) => t.key === activeFilter)?.label} 的測試案例`} icon="🔍" />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {filtered.map((test) => (
            <TestCaseRow key={test.id} test={test} usersMap={usersMap} statusesMap={statusesMap} />
          ))}
        </div>
      )}
    </div>
  )
}
