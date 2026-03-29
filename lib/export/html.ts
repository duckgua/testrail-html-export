import type { Run, TestWithResult, Case, CaseStep } from '@/lib/testrail/types'
import type { TestrailCredentials } from '@/lib/testrail/credentials'
import { formatDateTime } from '@/lib/utils/format'
import { computePassRate } from '@/lib/utils/status'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExportData {
  run: Run
  testsWithResults: TestWithResult[]
  caseMap: Map<number, Case>
  usersMap: Map<number, string>
  credentials: TestrailCredentials
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<number, string> = {
  1: 'Passed',
  2: 'Blocked',
  3: 'Untested',
  4: 'Retest',
  5: 'Failed',
}

// ── Image embedding ────────────────────────────────────────────────────────────

function toRestApiUrl(url: string, base: string): string {
  const m = url.match(/\/attachments\/get\/(\d+)/)
  if (m) return `${base}/index.php?/api/v2/get_attachment/${m[1]}`
  return url
}

async function fetchAsBase64(url: string, credentials: TestrailCredentials): Promise<string | null> {
  const authToken = Buffer.from(`${credentials.email}:${credentials.apiKey}`).toString('base64')
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${authToken}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/png'
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

async function embedImages(html: string, base: string, credentials: TestrailCredentials): Promise<string> {
  // Collect unique URLs (strip fragment)
  const urlSet = new Set<string>()
  const regex = /src="([^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const url = m[1]
    if (!url.startsWith('data:')) urlSet.add(url)
  }
  if (urlSet.size === 0) return html

  // Fetch all in parallel
  const urlMap = new Map<string, string>()
  await Promise.all(
    [...urlSet].map(async (rawUrl) => {
      const srcClean = rawUrl.split('#')[0]
      const absolute = /^https?:\/\//i.test(srcClean)
        ? srcClean
        : `${base}/${srcClean.replace(/^\//, '')}`
      const restUrl = toRestApiUrl(absolute, base)
      const dataUri = await fetchAsBase64(restUrl, credentials)
      if (dataUri) urlMap.set(rawUrl, dataUri)
    })
  )

  // Replace src attributes
  return html.replace(/src="([^"]+)"/gi, (_, url: string) => {
    const replacement = urlMap.get(url)
    return replacement ? `src="${replacement}"` : `src="${url}"`
  })
}

// ── HTML escaping ──────────────────────────────────────────────────────────────

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Rendering helpers ──────────────────────────────────────────────────────────

function renderHtmlField(html: string | null | undefined): string {
  if (!html) return ''
  // TestRail HTML is trusted internal content
  return `<div class="html-content">${html}</div>`
}

function renderStepsTable(steps: CaseStep[]): string {
  const rows = steps
    .filter((s) => s.content || s.expected)
    .map(
      (s, i) => `
      <tr>
        <td style="width:32px;color:#9ca3af;font-weight:600;text-align:center">${i + 1}</td>
        <td>${renderHtmlField(s.content)}</td>
        <td>${renderHtmlField(s.expected)}</td>
      </tr>`
    )
    .join('')

  if (!rows) return ''
  return `
    <table>
      <thead>
        <tr>
          <th style="width:32px">#</th>
          <th>步驟</th>
          <th>預期結果</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function renderTestCase(
  test: TestWithResult,
  caseDetail: Case | undefined,
  usersMap: Map<number, string>
): string {
  const statusId = test.status_id
  const statusLabel = STATUS_LABEL[statusId] ?? `Status ${statusId}`
  const assignee = test.assignedto_id ? usersMap.get(test.assignedto_id) : null
  const comment = test.latestResult?.comment ?? null

  // Steps section
  let stepsHtml = ''
  const steps = caseDetail?.custom_steps_separated ?? test.custom_steps_separated
  const hasStructured = steps && steps.length > 0

  if (hasStructured) {
    stepsHtml = renderStepsTable(steps)
  } else {
    const preconds = caseDetail?.custom_preconds ?? test.custom_preconds
    const rawSteps = caseDetail?.custom_steps ?? test.custom_steps
    const expected = caseDetail?.custom_expected ?? test.custom_expected

    if (preconds)
      stepsHtml += `<div class="section-block"><div class="section-label">前置條件</div>${renderHtmlField(preconds)}</div>`
    if (rawSteps)
      stepsHtml += `<div class="section-block"><div class="section-label">步驟</div>${renderHtmlField(rawSteps)}</div>`
    if (expected)
      stepsHtml += `<div class="section-block"><div class="section-label">預期結果</div>${renderHtmlField(expected)}</div>`
  }

  const commentHtml = comment
    ? `<div class="comment-box"><strong>備註：</strong>${renderHtmlField(comment)}</div>`
    : ''

  const metaHtml = assignee
    ? `<span class="case-meta">${esc(assignee)}</span>`
    : ''

  return `
  <details class="status-${statusId}">
    <summary>
      <svg class="summary-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="badge badge-${statusId}">${esc(statusLabel)}</span>
      <span class="case-title">${esc(test.title)}</span>
      ${metaHtml}
    </summary>
    <div class="case-detail">
      ${stepsHtml}
      ${commentHtml}
    </div>
  </details>`
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function renderProgressBar(run: Run): string {
  const total =
    run.passed_count + run.failed_count + run.blocked_count +
    run.untested_count + run.retest_count
  if (total === 0) return ''

  const pct = (n: number) => ((n / total) * 100).toFixed(1)

  const segments = [
    { cls: 'pb-passed', count: run.passed_count },
    { cls: 'pb-failed', count: run.failed_count },
    { cls: 'pb-blocked', count: run.blocked_count },
    { cls: 'pb-retest', count: run.retest_count },
    { cls: 'pb-untested', count: run.untested_count },
  ]
    .filter((s) => s.count > 0)
    .map((s) => `<div class="${s.cls}" style="flex:${pct(s.count)}"></div>`)
    .join('')

  const labels = [
    { cls: 'pb-passed', label: 'Passed', count: run.passed_count },
    { cls: 'pb-failed', label: 'Failed', count: run.failed_count },
    { cls: 'pb-blocked', label: 'Blocked', count: run.blocked_count },
    { cls: 'pb-retest', label: 'Retest', count: run.retest_count },
    { cls: 'pb-untested', label: 'Untested', count: run.untested_count },
  ]
    .filter((s) => s.count > 0)
    .map(
      (s) =>
        `<span><span class="label-dot" style="background:var(--${s.cls})"></span>${s.label}: ${s.count}</span>`
    )
    .join('')

  return `
    <div class="progress-bar">${segments}</div>
    <div class="progress-labels">${labels}</div>`
}

// ── Inline CSS ─────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --pb-passed: #22c55e; --pb-failed: #ef4444;
  --pb-blocked: #f59e0b; --pb-retest: #3b82f6; --pb-untested: #cbd5e1;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
       background: #f1f5f9; color: #111827; line-height: 1.5; }
.container { max-width: 960px; margin: 24px auto; padding: 0 16px; }

/* ── Header card ── */
.header-card {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  border-radius: 16px; padding: 28px; margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(37,99,235,.35);
}
.header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.run-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.run-meta { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 4px; }
.pass-rate { font-size: 36px; font-weight: 800; color: #fff; white-space: nowrap;
             background: rgba(255,255,255,.15); border-radius: 12px; padding: 6px 16px; }

/* ── Progress bar ── */
.progress-bar { display: flex; height: 10px; border-radius: 5px; overflow: hidden; gap: 2px; }
.pb-passed { background: var(--pb-passed); }
.pb-failed { background: var(--pb-failed); }
.pb-blocked { background: var(--pb-blocked); }
.pb-retest { background: var(--pb-retest); }
.pb-untested { background: var(--pb-untested); }
.progress-labels { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,.75); }
.label-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 3px; vertical-align: middle; }

/* ── Status badges ── */
.badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.badge-1 { background: #16a34a; color: #fff; }
.badge-2 { background: #d97706; color: #fff; }
.badge-3 { background: #94a3b8; color: #fff; }
.badge-4 { background: #2563eb; color: #fff; }
.badge-5 { background: #dc2626; color: #fff; }

/* ── Test case cards ── */
details {
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  margin-bottom: 6px; overflow: hidden;
  border-left: 4px solid #e2e8f0;
}
details.status-1 { border-left-color: #22c55e; }
details.status-2 { border-left-color: #f59e0b; }
details.status-3 { border-left-color: #94a3b8; }
details.status-4 { border-left-color: #3b82f6; }
details.status-5 { border-left-color: #ef4444; }
details[open] > summary { border-bottom: 1px solid #f1f5f9; }
summary { padding: 10px 14px; cursor: pointer; display: flex; align-items: center;
          gap: 8px; list-style: none; user-select: none; }
summary::-webkit-details-marker { display: none; }
summary:hover { background: #f8fafc; }
.summary-arrow { width: 14px; height: 14px; color: #94a3b8; flex-shrink: 0; transition: transform .2s; }
details[open] .summary-arrow { transform: rotate(90deg); }
.case-title { flex: 1; font-size: 14px; font-weight: 500; color: #1e293b; min-width: 0; }
.case-meta { font-size: 12px; color: #94a3b8; white-space: nowrap; margin-left: 8px; }
.case-detail { padding: 16px; background: #fafbfc; }
.section-block { margin-bottom: 14px; }
.section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;
                 letter-spacing: .06em; margin-bottom: 6px; }
.html-content { font-size: 13px; color: #374151; line-height: 1.65; }
.html-content img { max-width: 100%; border-radius: 6px; margin: 6px 0; display: block;
                    box-shadow: 0 1px 4px rgba(0,0,0,.12); }
.html-content p { margin-bottom: 4px; }
.html-content ul, .html-content ol { padding-left: 18px; margin-bottom: 4px; }

/* ── Table ── */
table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px;
        border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
th { background: #1e40af; color: #fff; padding: 9px 14px; text-align: left; font-weight: 600;
     font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #374151; }
tr:nth-child(even) td { background: #f8faff; }
tr:last-child td { border-bottom: none; }

/* ── Comment box ── */
.comment-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
               padding: 10px 12px; margin-top: 12px; font-size: 13px; color: #92400e; }

/* ── Footer ── */
.footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 28px 0 16px; }
`

// ── Main entry point ───────────────────────────────────────────────────────────

export async function generateRunHtml(data: ExportData): Promise<string> {
  const { run, testsWithResults, caseMap, usersMap, credentials } = data
  const { passRate } = computePassRate(run)
  const base = credentials.baseUrl.replace(/\/$/, '')
  const exportDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Render all test cases and embed images in parallel
  const caseHtmls = await Promise.all(
    testsWithResults.map(async (test) => {
      const caseDetail = caseMap.get(test.case_id)

      // Collect all HTML fields for this case
      const htmlFields = [
        caseDetail?.custom_preconds ?? test.custom_preconds,
        caseDetail?.custom_steps ?? test.custom_steps,
        caseDetail?.custom_expected ?? test.custom_expected,
        test.latestResult?.comment,
        ...(caseDetail?.custom_steps_separated ?? test.custom_steps_separated ?? []).flatMap((s) => [s.content, s.expected]),
      ]
        .filter(Boolean)
        .join('\n')

      // If there are any images, embed them for all fields at once
      let embeddedMap = new Map<string, string>()
      if (htmlFields.includes('<img') || htmlFields.includes('src=')) {
        const embeddedAll = await embedImages(htmlFields, base, credentials)
        const origMatches = [...htmlFields.matchAll(/src="([^"]+)"/g)]
        const embeddedMatches = [...embeddedAll.matchAll(/src="([^"]+)"/g)]
        origMatches.forEach((orig, i) => {
          if (embeddedMatches[i] && embeddedMatches[i][1].startsWith('data:')) {
            embeddedMap.set(orig[1], embeddedMatches[i][1])
          }
        })
      }

      // Apply embedded images to individual field renderer
      const embedInField = (html: string | null | undefined): string | null => {
        if (!html) return null
        if (embeddedMap.size === 0) return html
        return html.replace(/src="([^"]+)"/gi, (_, url: string) => {
          const replacement = embeddedMap.get(url)
          return replacement ? `src="${replacement}"` : `src="${url}"`
        })
      }

      // Build a case with embedded images
      const embeddedCase: Case | undefined = caseDetail
        ? {
            ...caseDetail,
            custom_preconds: embedInField(caseDetail.custom_preconds),
            custom_steps: embedInField(caseDetail.custom_steps),
            custom_expected: embedInField(caseDetail.custom_expected),
            custom_steps_separated: caseDetail.custom_steps_separated?.map((s) => ({
              ...s,
              content: embedInField(s.content) ?? s.content,
              expected: embedInField(s.expected) ?? s.expected,
            })) ?? null,
          }
        : undefined

      const embeddedTest: TestWithResult = {
        ...test,
        latestResult: test.latestResult
          ? { ...test.latestResult, comment: embedInField(test.latestResult.comment) }
          : null,
      }

      return renderTestCase(embeddedTest, embeddedCase, usersMap)
    })
  )

  const progressHtml = renderProgressBar(run)
  const completedBadge = run.is_completed
    ? '<span style="background:rgba(255,255,255,.2);color:#fff;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:600;margin-left:8px">已完成</span>'
    : ''
  const refsHtml = run.refs
    ? `<span style="margin-left:8px;font-size:12px;color:rgba(255,255,255,.6)">Refs: ${esc(run.refs)}</span>`
    : ''
  const descHtml = run.description
    ? `<div class="html-content" style="margin-top:8px;font-size:13px;color:rgba(255,255,255,.75)">${run.description}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(run.name)} - TestRail Export</title>
  <style>${STYLES}</style>
</head>
<body>
<div class="container">

  <div class="header-card">
    <div class="header-top">
      <div>
        <div class="run-title">${esc(run.name)}</div>
        <div class="run-meta">
          建立於 ${esc(formatDateTime(run.created_on))}${completedBadge}${refsHtml}
        </div>
        ${descHtml}
      </div>
      <div class="pass-rate">${passRate}%</div>
    </div>
    ${progressHtml}
  </div>

  ${caseHtmls.join('\n')}

  <div class="footer">匯出自 TestRail Dashboard &middot; ${exportDate}</div>
</div>
</body>
</html>`

  return html
}
