import type { TestrailCredentials } from './credentials'
import { PaginatedResponse } from '@/lib/testrail/types'

export async function testrailFetch<T>(
  endpoint: string,
  credentials: TestrailCredentials,
  params: Record<string, string | number> = {},
): Promise<T> {
  const { baseUrl, email, apiKey } = credentials
  const authToken = Buffer.from(`${email}:${apiKey}`).toString('base64')

  const queryParts = [`/api/v2/${endpoint}`]
  for (const [key, value] of Object.entries(params)) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  }
  const finalUrl = `${baseUrl}/index.php?${queryParts.join('&')}`

  const MAX_RETRIES = 3
  let lastResponse: Response | undefined
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(finalUrl, {
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5', 10)
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
      lastResponse = response
      continue
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`TestRail API error ${response.status}: ${errorText}`)
    }

    return response.json() as Promise<T>
  }

  const errorText = await lastResponse?.text().catch(() => 'Too Many Requests') ?? 'Too Many Requests'
  throw new Error(`TestRail API error 429: ${errorText}`)
}

export async function testrailFetchPaginated<T>(
  endpoint: string,
  resourceKey: string,
  credentials: TestrailCredentials,
  params: Record<string, string | number> = {},
): Promise<T[]> {
  const PAGE_SIZE = 250
  const firstPage = await testrailFetch<PaginatedResponse<T>>(
    endpoint,
    credentials,
    { ...params, limit: PAGE_SIZE, offset: 0 },
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
      credentials,
      { ...params, limit: PAGE_SIZE, offset },
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
