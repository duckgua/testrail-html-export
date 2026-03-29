'use client'

interface HtmlContentProps {
  html: string | null | undefined
  className?: string
}

function rewriteImageUrls(html: string): string {
  return html.replace(/src="([^"]+)"/gi, (_, src: string) => {
    if (src.startsWith('data:') || src.startsWith('/api/')) return `src="${src}"`
    const srcClean = src.split('#')[0]
    // Credentials are read from the HttpOnly session cookie server-side — no URL params needed
    const proxyUrl = /^https?:\/\//i.test(srcClean)
      ? `/api/testrail/image-proxy?url=${encodeURIComponent(srcClean)}`
      : `/api/testrail/image-proxy?path=${encodeURIComponent(srcClean)}`
    return `src="${proxyUrl}"`
  })
}

export default function HtmlContent({ html, className = '' }: HtmlContentProps) {
  if (!html) return null
  return (
    <div
      className={`prose prose-sm max-w-none text-gray-800
        prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
        prose-img:max-w-full prose-img:rounded prose-a:text-blue-600
        prose-pre:bg-gray-100 prose-pre:rounded prose-pre:p-2 prose-pre:text-xs
        ${className}`}
      dangerouslySetInnerHTML={{ __html: rewriteImageUrls(html) }}
    />
  )
}
