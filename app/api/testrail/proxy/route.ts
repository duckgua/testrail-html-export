import { NextRequest, NextResponse } from 'next/server'
import { extractCredentials } from '@/lib/testrail/credentials'

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  const pathParam = req.nextUrl.searchParams.get('path')

  if (!urlParam && !pathParam) {
    return NextResponse.json({ error: 'Missing url or path parameter' }, { status: 400 })
  }

  const creds = extractCredentials(req)
  if (!creds) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const normalizedBase = creds.baseUrl.replace(/\/$/, '')

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

  const authToken = Buffer.from(`${creds.email}:${creds.apiKey}`).toString('base64')

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
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
