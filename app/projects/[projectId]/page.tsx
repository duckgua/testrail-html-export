import { getProject, getMilestones, getRuns } from '@/lib/testrail/api'
import MilestoneSection from '@/components/runs/MilestoneSection'
import Breadcrumb from '@/components/layout/Breadcrumb'
import EmptyState from '@/components/ui/EmptyState'
import HtmlContent from '@/components/ui/HtmlContent'
import type { Run, Milestone } from '@/lib/testrail/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params
  const id = Number(projectId)

  const [project, milestones, runs] = await Promise.all([
    getProject(id),
    getMilestones(id),
    getRuns(id),
  ])

  // Group runs by milestone_id
  const runsByMilestone = new Map<number | null, Run[]>()
  runsByMilestone.set(null, [])

  for (const milestone of milestones) {
    runsByMilestone.set(milestone.id, [])
  }

  for (const run of runs) {
    const key = run.milestone_id ?? null
    if (!runsByMilestone.has(key)) {
      runsByMilestone.set(key, [])
    }
    runsByMilestone.get(key)!.push(run)
  }

  // Sort milestones: incomplete first, then by due_on
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
    return (a.due_on ?? 0) - (b.due_on ?? 0)
  })

  const ungroupedRuns = runsByMilestone.get(null) ?? []

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/' },
          { label: project.name },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.announcement && (
          <HtmlContent html={project.announcement} className="text-gray-500 mt-1" />
        )}
        <p className="text-sm text-gray-400 mt-1">
          {milestones.length} 個 Milestone · {runs.length} 個 Test Run
        </p>
      </div>

      {runs.length === 0 ? (
        <EmptyState message="此 Project 沒有任何 Test Run" icon="🏃" />
      ) : (
        <>
          {sortedMilestones.map((milestone: Milestone) => (
            <MilestoneSection
              key={milestone.id}
              milestone={milestone}
              runs={runsByMilestone.get(milestone.id) ?? []}
              projectId={id}
            />
          ))}
          {ungroupedRuns.length > 0 && (
            <MilestoneSection
              milestone={null}
              runs={ungroupedRuns}
              projectId={id}
            />
          )}
        </>
      )}
    </div>
  )
}
