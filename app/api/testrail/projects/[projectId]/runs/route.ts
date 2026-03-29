import { NextRequest, NextResponse } from 'next/server'
import { getRuns } from '@/lib/testrail/api'
import { extractCredentials } from '@/lib/testrail/credentials'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const creds = extractCredentials(req)
  if (!creds) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  try {
    const { projectId } = await params
    const id = Number(projectId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 })
    const runs = await getRuns(id, creds)
    return NextResponse.json(runs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
