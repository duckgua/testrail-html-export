import { NextRequest, NextResponse } from 'next/server'
import { getCase } from '@/lib/testrail/api'
import { extractCredentials } from '@/lib/testrail/credentials'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const creds = extractCredentials(req)
  if (!creds) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  try {
    const { caseId } = await params
    const id = Number(caseId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    const testCase = await getCase(id, creds)
    return NextResponse.json(testCase)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
