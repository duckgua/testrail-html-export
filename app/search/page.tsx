import { Suspense } from 'react'
import { getProjects } from '@/lib/testrail/api'
import SearchBar from '@/components/search/SearchBar'
import SearchResults from '@/components/search/SearchResults'
import Spinner from '@/components/ui/Spinner'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
  const projects = await getProjects()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">搜尋 Test Cases</h1>
        <p className="text-gray-500 mt-1">跨 Project 搜尋測試案例標題</p>
      </div>

      <div className="mb-6">
        <Suspense>
          <SearchBar projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  )
}
