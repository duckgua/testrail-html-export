import { testrailFetch, testrailFetchPaginated } from './client'
import type {
  Project,
  Suite,
  Section,
  Milestone,
  Run,
  Test,
  Result,
  Case,
  User,
} from './types'

// ── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  return testrailFetchPaginated<Project>('get_projects', 'projects', {}, 60)
}

export async function getProject(projectId: number): Promise<Project> {
  return testrailFetch<Project>(`get_project/${projectId}`, {}, 30)
}

// ── Suites ──────────────────────────────────────────────────────────────────

export async function getSuites(projectId: number): Promise<Suite[]> {
  // Single-suite projects return a single object, not an array
  try {
    const result = await testrailFetch<Suite[] | Suite>(
      `get_suites/${projectId}`,
      {},
      3600
    )
    return Array.isArray(result) ? result : [result]
  } catch {
    return []
  }
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(projectId: number, suiteId?: number): Promise<Section[]> {
  const params: Record<string, number> = {}
  if (suiteId) params.suite_id = suiteId
  return testrailFetchPaginated<Section>(`get_sections/${projectId}`, 'sections', params, 3600)
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function getMilestones(projectId: number): Promise<Milestone[]> {
  return testrailFetchPaginated<Milestone>(
    `get_milestones/${projectId}`,
    'milestones',
    {},
    300
  )
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export async function getRuns(projectId: number): Promise<Run[]> {
  return testrailFetchPaginated<Run>(`get_runs/${projectId}`, 'runs', {}, 30)
}

export async function getRecentRuns(projectId: number, limit = 1): Promise<Run[]> {
  const page = await testrailFetch<{ runs: Run[] } & Record<string, unknown>>(
    `get_runs/${projectId}`,
    { limit, offset: 0 },
    30
  )
  return page.runs ?? []
}

export async function getRun(runId: number): Promise<Run> {
  return testrailFetch<Run>(`get_run/${runId}`, {}, 30)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export async function getTests(runId: number): Promise<Test[]> {
  return testrailFetchPaginated<Test>(`get_tests/${runId}`, 'tests', {}, 15)
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function getResultsForRun(runId: number): Promise<Result[]> {
  return testrailFetchPaginated<Result>(
    `get_results_for_run/${runId}`,
    'results',
    {},
    15
  )
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  try {
    return await testrailFetchPaginated<User>('get_users', 'users', {}, 3600)
  } catch {
    return []
  }
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export async function getCase(caseId: number): Promise<Case> {
  return testrailFetch<Case>(`get_case/${caseId}`, {}, 15)
}

export async function getCases(
  projectId: number,
  suiteId?: number,
  sectionId?: number
): Promise<Case[]> {
  const params: Record<string, number> = {}
  if (suiteId) params.suite_id = suiteId
  if (sectionId) params.section_id = sectionId
  return testrailFetchPaginated<Case>(
    `get_cases/${projectId}`,
    'cases',
    params,
    15
  )
}
