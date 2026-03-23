import { NextRequest, NextResponse } from 'next/server'
import { getCase } from '@/lib/testrail/api'

// Debug route: GET /api/debug/case?id=<caseId>
// Returns the raw TestRail case fields so we can inspect the actual image src format.
// Remove this file after debugging is complete.
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 })

  const c = await getCase(id)

  // Return only the HTML fields that might contain images
  return NextResponse.json({
    id: c.id,
    title: c.title,
    custom_preconds: c.custom_preconds,
    custom_steps: c.custom_steps,
    custom_expected: c.custom_expected,
    custom_steps_separated: c.custom_steps_separated,
  })
}
