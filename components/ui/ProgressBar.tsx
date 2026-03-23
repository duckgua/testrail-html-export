interface ProgressBarProps {
  passed: number
  failed: number
  blocked: number
  untested: number
  retest?: number
  showLabels?: boolean
}

export default function ProgressBar({
  passed,
  failed,
  blocked,
  untested,
  retest = 0,
  showLabels = false,
}: ProgressBarProps) {
  const total = passed + failed + blocked + untested + retest
  if (total === 0) {
    return <div className="h-2 w-full rounded-full bg-gray-100" />
  }

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`

  return (
    <div className="space-y-1">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        {passed > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: pct(passed) }}
            title={`Passed: ${passed}`}
          />
        )}
        {failed > 0 && (
          <div
            className="bg-red-500 transition-all"
            style={{ width: pct(failed) }}
            title={`Failed: ${failed}`}
          />
        )}
        {blocked > 0 && (
          <div
            className="bg-yellow-500 transition-all"
            style={{ width: pct(blocked) }}
            title={`Blocked: ${blocked}`}
          />
        )}
        {retest > 0 && (
          <div
            className="bg-blue-400 transition-all"
            style={{ width: pct(retest) }}
            title={`Retest: ${retest}`}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {passed > 0 && <span className="text-green-700">✓ {passed} Passed</span>}
          {failed > 0 && <span className="text-red-700">✗ {failed} Failed</span>}
          {blocked > 0 && <span className="text-yellow-700">⊘ {blocked} Blocked</span>}
          {retest > 0 && <span className="text-blue-700">↺ {retest} Retest</span>}
          {untested > 0 && <span className="text-gray-500">○ {untested} Untested</span>}
        </div>
      )}
    </div>
  )
}
