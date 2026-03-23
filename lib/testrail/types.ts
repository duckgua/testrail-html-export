// TestRail API v2 TypeScript Interfaces

export interface Project {
  id: number
  name: string
  announcement: string | null
  show_announcement: boolean
  is_completed: boolean
  completed_on: number | null
  suite_mode: number // 1=single suite, 2=single+baselines, 3=multi-suite
  default_role_id: number | null
  url: string
}

export interface Suite {
  id: number
  name: string
  description: string | null
  project_id: number
  is_master: boolean
  is_baseline: boolean
  is_completed: boolean
  completed_on: number | null
  url: string
}

export interface Section {
  id: number
  suite_id: number
  parent_id: number | null
  name: string
  description: string | null
  depth: number
  display_order: number
}

export interface Milestone {
  id: number
  project_id: number
  parent_id: number | null
  name: string
  description: string | null
  start_on: number | null
  started_on: number | null
  due_on: number | null
  completed_on: number | null
  is_completed: boolean
  is_started: boolean
  url: string
  refs: string | null
  milestones: Milestone[] | null // sub-milestones
}

export interface Run {
  id: number
  suite_id: number | null
  project_id: number
  milestone_id: number | null
  name: string
  description: string | null
  created_by: number
  created_on: number
  completed_on: number | null
  is_completed: boolean
  plan_id: number | null
  config: string | null
  config_ids: number[]
  refs: string | null
  url: string
  passed_count: number
  blocked_count: number
  untested_count: number
  retest_count: number
  failed_count: number
  custom_status1_count: number
  custom_status2_count: number
  custom_status3_count: number
  custom_status4_count: number
  custom_status5_count: number
  custom_status6_count: number
  custom_status7_count: number
  assignedto_id: number | null
}

export interface Test {
  id: number
  case_id: number
  run_id: number
  status_id: number
  assignedto_id: number | null
  title: string
  template_id: number
  type_id: number
  priority_id: number
  estimate: string | null
  estimate_forecast: string | null
  refs: string | null
  milestone_id: number | null
  custom_expected: string | null
  custom_preconds: string | null
  custom_steps: string | null
  custom_steps_separated: CaseStep[] | null
}

export interface CaseStep {
  content: string
  expected: string
  additional_info: string
  refs: string
}

export interface Result {
  id: number
  test_id: number
  status_id: number
  created_by: number
  created_on: number
  assignedto_id: number | null
  comment: string | null
  version: string | null
  elapsed: string | null
  defects: string | null
  attachment_ids: number[]
}

export interface Case {
  id: number
  suite_id: number | null
  section_id: number | null
  template_id: number
  type_id: number
  priority_id: number
  milestone_id: number | null
  refs: string | null
  created_by: number
  created_on: number
  updated_by: number
  updated_on: number
  estimate: string | null
  estimate_forecast: string | null
  title: string
  custom_preconds: string | null
  custom_steps: string | null
  custom_expected: string | null
  custom_steps_separated: CaseStep[] | null
}

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  role_id: number
}

// Paginated response envelope
export interface PaginatedResponse<T> {
  offset: number
  limit: number
  size: number
  _links: {
    next: string | null
    prev: string | null
  }
  [resourceKey: string]: T[] | number | { next: string | null; prev: string | null }
}

// Enriched types for UI
export interface ProjectWithStats extends Project {
  passRate: number
  totalTests: number
  lastRunDate: number | null
}

export interface TestWithResult extends Test {
  latestResult: Result | null
}
