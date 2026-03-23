export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      <div className="h-8 w-72 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-40 bg-gray-100 rounded mb-8" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="mb-8">
          <div className="h-6 w-56 bg-gray-200 rounded mb-3" />
          <div className="h-2.5 bg-gray-100 rounded-full mb-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-2.5 bg-gray-100 rounded-full mb-3" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, k) => (
                    <div key={k} className="h-3 w-16 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
