'use client'

import { useCredentials } from '@/contexts/CredentialsContext'

interface HtmlContentProps {
  html: string | null | undefined
  className?: string
}

function rewriteImageUrls(html: string, baseUrl: string, email: string, apiKey: string): string {
  // Match src="..." with double quotes (TestRail always uses double quotes)
  return html.replace(/src="([^"]+)"/gi, (_, src: string) => {
    // Skip data URIs and already-proxied paths
    if (src.startsWith('data:') || src.startsWith('/api/')) return `src="${src}"`

    // Strip URL fragment (#_t=... cache-buster added by TestRail)
    const srcClean = src.split('#')[0]

    const credParams = `tr_url=${encodeURIComponent(baseUrl)}&tr_email=${encodeURIComponent(email)}&tr_key=${encodeURIComponent(apiKey)}`

    // Absolute URL → pass as ?url=
    // Relative path → pass as ?path=
    const proxyUrl = /^https?:\/\//i.test(srcClean)
      ? `/api/testrail/image-proxy?url=${encodeURIComponent(srcClean)}&${credParams}`
      : `/api/testrail/image-proxy?path=${encodeURIComponent(srcClean)}&${credParams}`

    return `src="${proxyUrl}"`
  })
}

/**
 * Renders HTML content from TestRail API fields (description, comment, steps, etc.)
 * TestRail is a trusted internal source, so dangerouslySetInnerHTML is acceptable here.
 * Images are proxied through /api/testrail/image-proxy to add Basic Auth.
 */
export default function HtmlContent({ html, className = '' }: HtmlContentProps) {
  const { credentials } = useCredentials()

  if (!html) return null

  const proxiedHtml = credentials
    ? rewriteImageUrls(html, credentials.baseUrl, credentials.email, credentials.apiKey)
    : html

  return (
    <div
      className={`prose prose-sm max-w-none text-gray-800
        prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
        prose-img:max-w-full prose-img:rounded prose-a:text-blue-600
        prose-pre:bg-gray-100 prose-pre:rounded prose-pre:p-2 prose-pre:text-xs
        ${className}`}
      dangerouslySetInnerHTML={{ __html: proxiedHtml }}
    />
  )
}
