import { NextResponse } from 'next/server'
import { getTests } from '@/lib/testrail/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params
    const id = Number(runId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
    const tests = await getTests(id)
    return NextResponse.json(tests)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
