import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'tr_session'
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  // No maxAge → session cookie, cleared when browser closes
}

// POST /api/session — set credentials in HttpOnly cookie
export async function POST(req: NextRequest) {
  try {
    const { baseUrl, email, apiKey } = await req.json()
    if (!baseUrl || !email || !apiKey) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, JSON.stringify({ baseUrl, email, apiKey }), COOKIE_OPTS)
    return res
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}

// DELETE /api/session — clear the cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTS, maxAge: 0 })
  return res
}
