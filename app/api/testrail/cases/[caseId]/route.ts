import { NextResponse } from 'next/server'
import { getCase } from '@/lib/testrail/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const id = Number(caseId)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    const testCase = await getCase(id)
    return NextResponse.json(testCase)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
