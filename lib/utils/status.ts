export interface StatusInfo {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
}

export const STATUS_MAP: Record<number, StatusInfo> = {
  1: {
    label: 'Passed',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    borderClass: 'border-green-200',
    dotClass: 'bg-green-500',
  },
  2: {
    label: 'Blocked',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-200',
    dotClass: 'bg-yellow-500',
  },
  3: {
    label: 'Untested',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-200',
    dotClass: 'bg-gray-400',
  },
  4: {
    label: 'Retest',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
  },
  5: {
    label: 'Failed',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
  },
}

export const DEFAULT_STATUS: StatusInfo = {
  label: 'Unknown',
  bgClass: 'bg-gray-100',
  textClass: 'text-gray-500',
  borderClass: 'border-gray-200',
  dotClass: 'bg-gray-300',
}

export function getStatus(statusId: number): StatusInfo {
  return STATUS_MAP[statusId] ?? DEFAULT_STATUS
}

export function computePassRate(run: {
  passed_count: number
  failed_count: number
  blocked_count: number
  untested_count: number
  retest_count: number
}): { passRate: number; total: number } {
  const total =
    run.passed_count +
    run.failed_count +
    run.blocked_count +
    run.untested_count +
    run.retest_count
  const passRate = total > 0 ? Math.round((run.passed_count / total) * 100) : 0
  return { passRate, total }
}
