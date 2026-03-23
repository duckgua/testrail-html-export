import { NextResponse } from 'next/server'
import { getMilestones } from '@/lib/testrail/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const id = Number(projectId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 })
    const milestones = await getMilestones(id)
    return NextResponse.json(milestones)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
