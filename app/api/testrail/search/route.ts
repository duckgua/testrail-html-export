import { NextRequest, NextResponse } from 'next/server'
import { getProjects, getSuites, getCases, getSections } from '@/lib/testrail/api'
import { extractCredentials } from '@/lib/testrail/credentials'
import type { Case, Section, Suite, Project } from '@/lib/testrail/types'
import type { TestrailCredentials } from '@/lib/testrail/credentials'

export interface SearchResult {
  caseId: number
  title: string
  projectId: number
  projectName: string
  suiteId: number | null
  suiteName: string
  sectionId: number | null
  sectionName: string
}

export async function GET(req: NextRequest) {
  const creds = extractCredentials(req)
  if (!creds) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

  const query = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const projectIdParam = req.nextUrl.searchParams.get('projectId')

  if (query.length < 3) {
    return NextResponse.json([])
  }

  try {
    const projects = await getProjects(creds)
    const targetProjects = projectIdParam
      ? projects.filter((p) => p.id === Number(projectIdParam))
      : projects.slice(0, 5) // limit to first 5 to avoid timeout

    const results = await Promise.all(
      targetProjects.map((project) => searchInProject(project, query, creds))
    )

    const flat = results.flat().slice(0, 100) // max 100 results
    return NextResponse.json(flat)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

/** Strip HTML tags so we can do plain-text search on HTML fields. */
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Build a single searchable text blob from all relevant Case fields. */
function caseSearchText(c: Case): string {
  const parts: string[] = [c.title]

  // Flat HTML fields
  parts.push(stripHtml(c.custom_preconds))
  parts.push(stripHtml(c.custom_steps))
  parts.push(stripHtml(c.custom_expected))

  // Structured steps (if present)
  if (c.custom_steps_separated) {
    for (const step of c.custom_steps_separated) {
      parts.push(stripHtml(step.content))
      parts.push(stripHtml(step.expected))
    }
  }

  return parts.join(' ').toLowerCase()
}

async function searchInProject(
  project: Project,
  query: string,
  creds: TestrailCredentials
): Promise<SearchResult[]> {
  const suites = await getSuites(project.id, creds)
  if (suites.length === 0) return []

  const lowerQuery = query.toLowerCase()

  const suiteResults = await Promise.all(
    suites.map(async (suite: Suite) => {
      const [cases, sections] = await Promise.all([
        getCases(project.id, creds, suite.id),
        getSections(project.id, creds, suite.id),
      ])

      const sectionMap = new Map<number, Section>(
        sections.map((s) => [s.id, s])
      )

      return cases
        .filter((c: Case) => caseSearchText(c).includes(lowerQuery))
        .map((c: Case): SearchResult => ({
          caseId: c.id,
          title: c.title,
          projectId: project.id,
          projectName: project.name,
          suiteId: suite.id,
          suiteName: suite.name,
          sectionId: c.section_id,
          sectionName: c.section_id
            ? (sectionMap.get(c.section_id)?.name ?? '—')
            : '—',
        }))
    })
  )

  return suiteResults.flat()
}
