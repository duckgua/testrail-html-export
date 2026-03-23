import { NextResponse } from 'next/server'
import { getResultsForRun } from '@/lib/testrail/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params
    const id = Number(runId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
    const results = await getResultsForRun(id)
    return NextResponse.json(results)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
