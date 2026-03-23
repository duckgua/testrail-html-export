export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-5 w-2/3 bg-gray-200 rounded" />
              <div className="h-5 w-10 bg-gray-100 rounded" />
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full mb-3" />
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
