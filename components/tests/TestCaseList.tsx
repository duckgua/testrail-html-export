'use client'

import { useState, useMemo } from 'react'
import EmptyState from '@/components/ui/EmptyState'
import TestCaseRow from './TestCaseRow'
import type { TestWithResult } from '@/lib/testrail/types'

type FilterKey = 'all' | 'passed' | 'failed' | 'blocked' | 'untested'
export type SortKey = 'default' | 'status' | 'priority'

const STATUS_SORT_ORDER: Record<number, number> = {
  5: 0, // Failed
  2: 1, // Blocked
  4: 2, // Retest / custom
  3: 3, // Untested
  1: 4, // Passed
}

interface FilterTab {
  key: FilterKey
  label: string
  count: number
}

interface TestCaseListProps {
  tests: TestWithResult[]
  usersMap?: Map<number, string>
  statusesMap?: Map<number, string>
  sortBy: SortKey
  onSortChange: (s: SortKey) => void
}

export default function TestCaseList({
  tests,
  usersMap = new Map(),
  statusesMap,
  sortBy,
  onSortChange,
}: TestCaseListProps) {
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
    { key: 'passed', label: 'Passed', count: counts.passed },
    { key: 'failed', label: 'Failed', count: counts.failed },
    { key: 'blocked', label: 'Blocked', count: counts.blocked },
    { key: 'untested', label: 'Untested', count: counts.untested },
  ]

  const filtered = useMemo(() => {
    let result =
      activeFilter === 'all'
        ? tests
        : tests.filter((t) => {
            if (activeFilter === 'passed') return t.status_id === 1
            if (activeFilter === 'failed') return t.status_id === 5
            if (activeFilter === 'blocked') return t.status_id === 2
            if (activeFilter === 'untested') return t.status_id === 3
            return true
          })

    if (sortBy === 'status') {
      result = [...result].sort((a, b) => {
        const oa = STATUS_SORT_ORDER[a.status_id] ?? 99
        const ob = STATUS_SORT_ORDER[b.status_id] ?? 99
        return oa - ob
      })
    } else if (sortBy === 'priority') {
      result = [...result].sort((a, b) => b.priority_id - a.priority_id)
    }

    return result
  }, [tests, activeFilter, sortBy])

  if (tests.length === 0) {
    return <EmptyState message="此 Run 沒有任何 Test Case" icon="📋" />
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'default', label: '預設' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mb-4">
        {/* Filter tabs — no inline Badge to avoid width-change reflow on click */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
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

        {/* Sort controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-400">排序：</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onSortChange(opt.key)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors whitespace-nowrap ${
                sortBy === opt.key
                  ? 'bg-gray-800 border-gray-800 text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
