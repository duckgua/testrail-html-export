import Link from 'next/link'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/format'
import { computePassRate } from '@/lib/utils/status'
import type { Run } from '@/lib/testrail/types'

interface RunCardProps {
  run: Run
  projectId: number
}

export default function RunCard({ run, projectId }: RunCardProps) {
  const { passRate, total } = computePassRate(run)

  return (
    <Link
      href={`/projects/${projectId}/runs/${run.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {run.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDateTime(run.created_on)} · {formatRelativeTime(run.created_on)}
            {run.refs && (
              <span className="ml-2 text-gray-500 font-medium">· {run.refs}</span>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold text-gray-700">{passRate}%</span>
          {run.is_completed && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">完成</span>
          )}
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

      <p className="mt-2 text-xs text-gray-400 text-right">{total} 個測試</p>
    </Link>
  )
}
