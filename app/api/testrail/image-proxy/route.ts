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

  const baseUrl = process.env.TESTRAIL_BASE_URL
  const email = process.env.TESTRAIL_EMAIL
  const apiKey = process.env.TESTRAIL_API_KEY

  if (!baseUrl || !email || !apiKey) {
    console.error('[image-proxy] missing env vars — baseUrl:', baseUrl, 'email:', email, 'apiKey set:', !!apiKey)
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const normalizedBase = baseUrl.replace(/\/$/, '')

  // Resolve the raw target URL from query params
  let rawUrl: string
  if (urlParam) {
    if (!urlParam.startsWith(normalizedBase)) {
      console.error('[image-proxy] SSRF blocked:', urlParam)
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

  console.log('[image-proxy] raw url:', rawUrl)
  console.log('[image-proxy] fetching:', targetUrl)

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
      cache: 'no-store',
    })

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    console.log('[image-proxy] status:', upstream.status, '| content-type:', contentType)

    if (!upstream.ok) {
      const text = await upstream.text()
      console.error('[image-proxy] error body (first 300):', text.slice(0, 300))
      return new NextResponse(null, { status: upstream.status })
    }

    const body = await upstream.arrayBuffer()
    console.log('[image-proxy] success — bytes:', body.byteLength)

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
