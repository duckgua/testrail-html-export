'use client'

import { useEffect, useState } from 'react'
import { useCredentials } from '@/contexts/CredentialsContext'
import { trHeaders } from '@/lib/testrail/credentials'
import { computePassRate } from '@/lib/utils/status'
import ProjectCard from '@/components/projects/ProjectCard'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import type { ProjectWithStats } from '@/lib/testrail/types'

export default function HomePage() {
  const { credentials } = useCredentials()
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!credentials) return
    setLoading(true)
    setError(null)

    fetch('/api/testrail/projects', { headers: trHeaders(credentials) })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(async (rawProjects) => {
        const enriched: ProjectWithStats[] = await Promise.all(
          rawProjects.map(async (project: { id: number; name: string }) => {
            try {
              const res = await fetch(
                `/api/testrail/projects/${project.id}/runs`,
                { headers: trHeaders(credentials) }
              )
              const runs = res.ok ? await res.json() : []
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
        setProjects(enriched)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [credentials])

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">所有 Projects</h1>
        <p className="text-gray-500 mt-1">{projects.length} 個 Project</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState message="沒有找到任何 Project" icon="📁" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
