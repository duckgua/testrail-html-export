import { PaginatedResponse } from '@/lib/testrail/types'

function getAuthToken(): string {
  const email = process.env.TESTRAIL_EMAIL
  const apiKey = process.env.TESTRAIL_API_KEY
  if (!email || !apiKey) {
    throw new Error('Missing TESTRAIL_EMAIL or TESTRAIL_API_KEY environment variables')
  }
  return Buffer.from(`${email}:${apiKey}`).toString('base64')
}

function getBaseUrl(): string {
  const baseUrl = process.env.TESTRAIL_BASE_URL
  if (!baseUrl) {
    throw new Error('Missing TESTRAIL_BASE_URL environment variable')
  }
  return baseUrl.replace(/\/$/, '')
}

export async function testrailFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  ttl = 60
): Promise<T> {
  const baseUrl = getBaseUrl()
  const authToken = getAuthToken()

  const url = new URL(`${baseUrl}/index.php`)
  url.searchParams.set('/api/v2/' + endpoint, '')
  // Build proper URL: baseUrl/index.php?/api/v2/endpoint&param=value
  const queryParts = [`/api/v2/${endpoint}`]
  for (const [key, value] of Object.entries(params)) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  }
  const finalUrl = `${baseUrl}/index.php?${queryParts.join('&')}`

  const response = await fetch(finalUrl, {
    headers: {
      Authorization: `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: ttl },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`TestRail API error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<T>
}

export async function testrailFetchPaginated<T>(
  endpoint: string,
  resourceKey: string,
  params: Record<string, string | number> = {},
  ttl = 60
): Promise<T[]> {
  const PAGE_SIZE = 250
  const firstPage = await testrailFetch<PaginatedResponse<T>>(
    endpoint,
    { ...params, limit: PAGE_SIZE, offset: 0 },
    ttl
  )

  const items = firstPage[resourceKey] as T[]
  if (!firstPage._links.next || items.length < PAGE_SIZE) {
    return items
  }

  const allItems = [...items]
  let offset = PAGE_SIZE

  while (true) {
    const page = await testrailFetch<PaginatedResponse<T>>(
      endpoint,
      { ...params, limit: PAGE_SIZE, offset },
      ttl
    )
    const pageItems = page[resourceKey] as T[]
    allItems.push(...pageItems)

    if (!page._links.next || pageItems.length < PAGE_SIZE) {
      break
    }
    offset += PAGE_SIZE
  }

  return allItems
}
