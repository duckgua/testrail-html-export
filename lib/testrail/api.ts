import { testrailFetch, testrailFetchPaginated } from './client'
import type { TestrailCredentials } from './credentials'
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
  Status,
} from './types'

// ── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(credentials: TestrailCredentials): Promise<Project[]> {
  return testrailFetchPaginated<Project>('get_projects', 'projects', credentials, {})
}

export async function getProject(projectId: number, credentials: TestrailCredentials): Promise<Project> {
  return testrailFetch<Project>(`get_project/${projectId}`, credentials)
}

// ── Suites ──────────────────────────────────────────────────────────────────

export async function getSuites(projectId: number, credentials: TestrailCredentials): Promise<Suite[]> {
  // Single-suite projects return a single object, not an array
  try {
    const result = await testrailFetch<Suite[] | Suite>(
      `get_suites/${projectId}`,
      credentials,
    )
    return Array.isArray(result) ? result : [result]
  } catch {
    return []
  }
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(projectId: number, credentials: TestrailCredentials, suiteId?: number): Promise<Section[]> {
  const params: Record<string, number> = {}
  if (suiteId) params.suite_id = suiteId
  return testrailFetchPaginated<Section>(`get_sections/${projectId}`, 'sections', credentials, params)
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function getMilestones(projectId: number, credentials: TestrailCredentials): Promise<Milestone[]> {
  return testrailFetchPaginated<Milestone>(
    `get_milestones/${projectId}`,
    'milestones',
    credentials,
  )
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export async function getRuns(projectId: number, credentials: TestrailCredentials): Promise<Run[]> {
  return testrailFetchPaginated<Run>(`get_runs/${projectId}`, 'runs', credentials)
}

export async function getRecentRuns(projectId: number, credentials: TestrailCredentials, limit = 1): Promise<Run[]> {
  const page = await testrailFetch<{ runs: Run[] } & Record<string, unknown>>(
    `get_runs/${projectId}`,
    credentials,
    { limit, offset: 0 },
  )
  return page.runs ?? []
}

export async function getRun(runId: number, credentials: TestrailCredentials): Promise<Run> {
  return testrailFetch<Run>(`get_run/${runId}`, credentials)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export async function getTests(runId: number, credentials: TestrailCredentials): Promise<Test[]> {
  return testrailFetchPaginated<Test>(`get_tests/${runId}`, 'tests', credentials)
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function getResultsForRun(runId: number, credentials: TestrailCredentials): Promise<Result[]> {
  return testrailFetchPaginated<Result>(
    `get_results_for_run/${runId}`,
    'results',
    credentials,
  )
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUsers(credentials: TestrailCredentials): Promise<User[]> {
  try {
    return await testrailFetchPaginated<User>('get_users', 'users', credentials)
  } catch {
    return []
  }
}

// ── Statuses ──────────────────────────────────────────────────────────────────

export async function getStatuses(credentials: TestrailCredentials): Promise<Status[]> {
  try {
    return await testrailFetch<Status[]>('get_statuses', credentials)
  } catch {
    return []
  }
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export async function getCase(caseId: number, credentials: TestrailCredentials): Promise<Case> {
  return testrailFetch<Case>(`get_case/${caseId}`, credentials)
}

export async function getCases(
  projectId: number,
  credentials: TestrailCredentials,
  suiteId?: number,
  sectionId?: number
): Promise<Case[]> {
  const params: Record<string, number> = {}
  if (suiteId) params.suite_id = suiteId
  if (sectionId) params.section_id = sectionId
  return testrailFetchPaginated<Case>(
    `get_cases/${projectId}`,
    'cases',
    credentials,
    params,
  )
}
