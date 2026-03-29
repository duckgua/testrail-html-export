'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCredentials } from '@/contexts/CredentialsContext'
import { trHeaders } from '@/lib/testrail/credentials'
import MilestoneSection from '@/components/runs/MilestoneSection'
import Breadcrumb from '@/components/layout/Breadcrumb'
import EmptyState from '@/components/ui/EmptyState'
import HtmlContent from '@/components/ui/HtmlContent'
import Spinner from '@/components/ui/Spinner'
import type { Run, Milestone, Project } from '@/lib/testrail/types'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const id = Number(projectId)
  const { credentials } = useCredentials()

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!credentials) return
    setLoading(true)
    setError(null)

    const h = trHeaders(credentials)
    Promise.all([
      fetch(`/api/testrail/projects/${id}/runs`, { headers: h }).then((r) => r.json()),
      fetch(`/api/testrail/projects/${id}/milestones`, { headers: h }).then((r) => r.json()),
    ])
      .then(([runsData, milestonesData]) => {
        // Derive minimal project info from runs if available
        setRuns(Array.isArray(runsData) ? runsData : [])
        setMilestones(Array.isArray(milestonesData) ? milestonesData : [])
        // Fetch project details separately for the name/announcement
        return fetch(`/api/testrail/projects`, { headers: h })
          .then((r) => r.json())
          .then((all) => {
            const p = all.find((p: Project) => p.id === id)
            if (p) setProject(p)
          })
          .catch(() => null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [credentials, id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">載入失敗：{error}</p>
      </div>
    )
  }

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
  const projectName = project?.name ?? `Project ${id}`

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/' },
          { label: projectName },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
        {project?.announcement && (
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
