import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  const pathParam = req.nextUrl.searchParams.get('path')

  if (!urlParam && !pathParam) {
    return NextResponse.json({ error: 'Missing url or path parameter' }, { status: 400 })
  }

  const baseUrl = process.env.TESTRAIL_BASE_URL
  const email = process.env.TESTRAIL_EMAIL
  const apiKey = process.env.TESTRAIL_API_KEY

  if (!baseUrl || !email || !apiKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const normalizedBase = baseUrl.replace(/\/$/, '')

  let targetUrl: string
  if (urlParam) {
    // SSRF protection: absolute URL must start with our TestRail base
    if (!urlParam.startsWith(normalizedBase)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
    }
    targetUrl = urlParam
  } else {
    // Relative path — prepend TestRail base URL
    const cleanPath = pathParam!.startsWith('/') ? pathParam! : `/${pathParam}`
    targetUrl = `${normalizedBase}${cleanPath}`
  }

  const authToken = Buffer.from(`${email}:${apiKey}`).toString('base64')

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
      // Don't cache in Next.js fetch cache — we handle it via response headers
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from TestRail' }, { status: 502 })
  }
}
