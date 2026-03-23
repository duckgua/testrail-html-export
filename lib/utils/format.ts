export function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—'
  const now = Date.now()
  const diffMs = now - timestamp * 1000
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) return formatDate(timestamp)
  if (diffDays > 0) return `${diffDays} 天前`
  if (diffHours > 0) return `${diffHours} 小時前`
  if (diffMins > 0) return `${diffMins} 分鐘前`
  return '剛剛'
}
