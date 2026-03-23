interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({
  title = '發生錯誤',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="text-2xl mb-2">⚠️</div>
      <h3 className="font-semibold text-red-800 mb-1">{title}</h3>
      <p className="text-sm text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          重試
        </button>
      )}
    </div>
  )
}
