import { NextRequest, NextResponse } from 'next/server'
import { getTests } from '@/lib/testrail/api'
import { extractCredentials } from '@/lib/testrail/credentials'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const creds = extractCredentials(req)
  if (!creds) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  try {
    const { runId } = await params
    const id = Number(runId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
    const tests = await getTests(id, creds)
    return NextResponse.json(tests)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
