import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils/format'
import type { ProjectWithStats } from '@/lib/testrail/types'

interface ProjectCardProps {
  project: ProjectWithStats
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group">
      {/* External TestRail link — sits above the main Link to avoid nesting */}
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors z-10"
          title="在 TestRail 開啟"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      <Link href={`/projects/${project.id}`} className="block p-5">
        <div className="flex items-start gap-3 mb-4 pr-6">
          <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug flex-1">
            {project.name}
          </h2>
          <span className="shrink-0 text-lg font-bold text-gray-700">
            {project.passRate}%
          </span>
        </div>

        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${project.passRate}%` }}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${100 - project.passRate}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>{project.totalTests} 個測試</span>
          <span>最近執行：{formatRelativeTime(project.lastRunDate ?? undefined)}</span>
        </div>
      </Link>
    </div>
  )
}
