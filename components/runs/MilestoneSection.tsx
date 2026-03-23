import RunCard from './RunCard'
import ProgressBar from '@/components/ui/ProgressBar'
import HtmlContent from '@/components/ui/HtmlContent'
import { formatDate } from '@/lib/utils/format'
import type { Milestone, Run } from '@/lib/testrail/types'

interface MilestoneSectionProps {
  milestone: Milestone | null // null = ungrouped
  runs: Run[]
  projectId: number
}

export default function MilestoneSection({
  milestone,
  runs,
  projectId,
}: MilestoneSectionProps) {
  if (runs.length === 0) return null

  const totalPassed = runs.reduce((s, r) => s + r.passed_count, 0)
  const totalFailed = runs.reduce((s, r) => s + r.failed_count, 0)
  const totalBlocked = runs.reduce((s, r) => s + r.blocked_count, 0)
  const totalUntested = runs.reduce((s, r) => s + r.untested_count, 0)
  const totalRetest = runs.reduce((s, r) => s + r.retest_count, 0)

  return (
    <section className="mb-8">
      <div className="mb-3">
        {milestone ? (
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>🎯</span>
                {milestone.name}
                {milestone.is_completed && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                    完成
                  </span>
                )}
              </h2>
              {milestone.description && (
                <HtmlContent html={milestone.description} className="text-sm text-gray-500 mt-0.5" />
              )}
              {milestone.due_on && (
                <p className="text-xs text-gray-400 mt-0.5">
                  截止日期：{formatDate(milestone.due_on)}
                </p>
              )}
            </div>
            <span className="text-sm text-gray-400 shrink-0">{runs.length} 個 Run</span>
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📋</span> 未分類 Runs
          </h2>
        )}

        {milestone && (
          <ProgressBar
            passed={totalPassed}
            failed={totalFailed}
            blocked={totalBlocked}
            untested={totalUntested}
            retest={totalRetest}
            showLabels
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {runs.map((run) => (
          <RunCard key={run.id} run={run} projectId={projectId} />
        ))}
      </div>
    </section>
  )
}
