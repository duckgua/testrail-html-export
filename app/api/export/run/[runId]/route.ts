import { NextRequest, NextResponse } from 'next/server'
import { extractCredentials } from '@/lib/testrail/credentials'
import { getRun, getTests, getResultsForRun, getUsers, getCase, getStatuses } from '@/lib/testrail/api'
import { generateRunHtml } from '@/lib/export/html'
import type { Result, TestWithResult, Case } from '@/lib/testrail/types'
import type { TestrailCredentials } from '@/lib/testrail/credentials'

// Fetch cases in batches to avoid overwhelming the TestRail API
async function fetchCasesInBatches(
  caseIds: number[],
  credentials: TestrailCredentials,
  batchSize = 10
): Promise<Map<number, Case>> {
  const unique = [...new Set(caseIds)]
  const caseMap = new Map<number, Case>()

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize)
    const cases = await Promise.all(
      batch.map((id) => getCase(id, credentials).catch(() => null))
    )
    cases.forEach((c, idx) => {
      if (c) caseMap.set(batch[idx], c)
    })
  }

  return caseMap
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\u4e00-\u9fff\- ]/g, '_').slice(0, 80)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const creds = extractCredentials(req)
  if (!creds) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const { runId } = await params
  const rid = Number(runId)
  if (!rid) return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })

  try {
    // Fetch base data in parallel
    const [run, tests, results, users, statuses] = await Promise.all([
      getRun(rid, creds),
      getTests(rid, creds),
      getResultsForRun(rid, creds),
      getUsers(creds),
      getStatuses(creds),
    ])

    // Merge tests with latest results
    const latestResultMap = new Map<number, Result>()
    for (const result of results) {
      if (!latestResultMap.has(result.test_id)) {
        latestResultMap.set(result.test_id, result)
      }
    }

    const testsWithResults: TestWithResult[] = tests.map((test) => ({
      ...test,
      latestResult: latestResultMap.get(test.id) ?? null,
    }))

    // Fetch all case details (batched)
    const caseIds = testsWithResults.map((t) => t.case_id)
    const caseMap = await fetchCasesInBatches(caseIds, creds)

    // Build user map and status map
    const usersMap = new Map<number, string>(users.map((u) => [u.id, u.name]))
    const statusesMap = new Map<number, string>(statuses.map((s) => [s.id, s.label]))

    // Apply sort
    const sort = req.nextUrl.searchParams.get('sort') ?? 'default'
    const STATUS_SORT_ORDER: Record<number, number> = { 5: 0, 2: 1, 4: 2, 3: 3, 1: 4 }
    const sortedTests =
      sort === 'status'
        ? [...testsWithResults].sort((a, b) => (STATUS_SORT_ORDER[a.status_id] ?? 99) - (STATUS_SORT_ORDER[b.status_id] ?? 99))
        : sort === 'priority'
          ? [...testsWithResults].sort((a, b) => b.priority_id - a.priority_id)
          : testsWithResults

    // Generate HTML
    const html = await generateRunHtml({ run, testsWithResults: sortedTests, caseMap, usersMap, statusesMap, credentials: creds })
    const filename = `run-${sanitizeFilename(run.name)}.html`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[export] failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
