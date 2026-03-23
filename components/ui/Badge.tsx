import { getStatus } from '@/lib/utils/status'

interface BadgeProps {
  statusId: number
  size?: 'sm' | 'md'
}

export default function Badge({ statusId, size = 'md' }: BadgeProps) {
  const status = getStatus(statusId)
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeClass} ${status.bgClass} ${status.textClass} ${status.borderClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
      {status.label}
    </span>
  )
}
