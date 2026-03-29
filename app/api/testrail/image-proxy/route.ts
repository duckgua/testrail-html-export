import { NextRequest, NextResponse } from 'next/server'

/**
 * TestRail's web-app URL  (/index.php?/attachments/get/:id)  does NOT accept API-key
 * Basic Auth — it returns a login HTML page (200 text/html).
 *
 * The REST API endpoint  (/index.php?/api/v2/get_attachment/:id)  DOES accept
 * Basic Auth (email:api_key) and returns the raw binary.
 *
 * This function rewrites the web-app URL to the REST API equivalent when possible.
 */
function toRestApiUrl(url: string, normalizedBase: string): string {
  // e.g. https://jyproject.testrail.io/index.php?/attachments/get/123
  const m = url.match(/\/attachments\/get\/(\d+)/)
  if (m) {
    return `${normalizedBase}/index.php?/api/v2/get_attachment/${m[1]}`
  }
  return url // not an attachment URL — use as-is
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  const pathParam = req.nextUrl.searchParams.get('path')

  if (!urlParam && !pathParam) {
    return NextResponse.json({ error: 'Missing url or path parameter' }, { status: 400 })
  }

  // Credentials: prefer X-TR-* headers, fall back to HttpOnly session cookie
  let baseUrl = req.headers.get('X-TR-Url')
  let email = req.headers.get('X-TR-Email')
  let apiKey = req.headers.get('X-TR-Key')

  if (!baseUrl || !email || !apiKey) {
    try {
      const cookie = req.cookies.get('tr_session')?.value
      if (cookie) {
        const parsed = JSON.parse(cookie)
        baseUrl = baseUrl ?? parsed.baseUrl
        email = email ?? parsed.email
        apiKey = apiKey ?? parsed.apiKey
      }
    } catch {
      // ignore malformed cookie
    }
  }

  if (!baseUrl || !email || !apiKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const normalizedBase = baseUrl.replace(/\/$/, '')

  // Resolve the raw target URL from query params
  let rawUrl: string
  if (urlParam) {
    if (!urlParam.startsWith(normalizedBase)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
    }
    rawUrl = urlParam
  } else {
    const cleanPath = pathParam!.startsWith('/') ? pathParam! : `/${pathParam}`
    rawUrl = `${normalizedBase}${cleanPath}`
  }

  // Rewrite to REST API URL so Basic Auth (email:api_key) works
  const targetUrl = toRestApiUrl(rawUrl, normalizedBase)
  const authToken = Buffer.from(`${email}:${apiKey}`).toString('base64')

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
      cache: 'no-store',
    })

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[image-proxy] fetch threw:', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
