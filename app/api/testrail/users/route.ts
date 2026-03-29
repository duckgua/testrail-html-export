import { NextRequest, NextResponse } from 'next/server'
import { getUsers } from '@/lib/testrail/api'
import { extractCredentials } from '@/lib/testrail/credentials'

export async function GET(req: NextRequest) {
  const creds = extractCredentials(req)
  if (!creds) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  try {
    const users = await getUsers(creds)
    return NextResponse.json(users)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
