import { NextRequest, NextResponse } from 'next/server'
import { extractCredentials } from '@/lib/testrail/credentials'
import { getStatuses } from '@/lib/testrail/api'

export async function GET(req: NextRequest) {
  const creds = extractCredentials(req)
  if (!creds) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  try {
    const statuses = await getStatuses(creds)
    return NextResponse.json(statuses)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
