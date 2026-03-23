import { NextResponse } from 'next/server'
import { getRuns } from '@/lib/testrail/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const id = Number(projectId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 })
    const runs = await getRuns(id)
    return NextResponse.json(runs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
