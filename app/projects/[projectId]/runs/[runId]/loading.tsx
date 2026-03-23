export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-64 bg-gray-200 rounded mb-6" />
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex justify-between mb-4">
          <div>
            <div className="h-6 w-72 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
          <div className="h-8 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="h-4 w-4 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-4 flex-1 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
