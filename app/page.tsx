import { getProjects, getRecentRuns } from '@/lib/testrail/api'
import { computePassRate } from '@/lib/utils/status'
import ProjectCard from '@/components/projects/ProjectCard'
import EmptyState from '@/components/ui/EmptyState'
import type { ProjectWithStats } from '@/lib/testrail/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const projects = await getProjects()

  const enriched: ProjectWithStats[] = await Promise.all(
    projects.map(async (project) => {
      try {
        const runs = await getRecentRuns(project.id, 1)
        const lastRun = runs[0] ?? null
        const { passRate, total } = lastRun
          ? computePassRate(lastRun)
          : { passRate: 0, total: 0 }
        return {
          ...project,
          passRate,
          totalTests: total,
          lastRunDate: lastRun?.created_on ?? null,
        }
      } catch {
        return { ...project, passRate: 0, totalTests: 0, lastRunDate: null }
      }
    })
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">所有 Projects</h1>
        <p className="text-gray-500 mt-1">{projects.length} 個 Project</p>
      </div>

      {enriched.length === 0 ? (
        <EmptyState message="沒有找到任何 Project" icon="📁" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enriched.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
