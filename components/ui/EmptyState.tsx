interface EmptyStateProps {
  message: string
  icon?: string
}

export default function EmptyState({ message, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gray-500">{message}</p>
    </div>
  )
}
