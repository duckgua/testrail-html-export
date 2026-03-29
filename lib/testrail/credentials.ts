export interface TestrailCredentials {
  baseUrl: string
  email: string
  apiKey: string
}

export function extractCredentials(req: Request): TestrailCredentials | null {
  const baseUrl = req.headers.get('X-TR-Url')
  const email = req.headers.get('X-TR-Email')
  const apiKey = req.headers.get('X-TR-Key')
  if (!baseUrl || !email || !apiKey) return null
  return { baseUrl: baseUrl.replace(/\/$/, ''), email, apiKey }
}

export function trHeaders(creds: TestrailCredentials): Record<string, string> {
  return {
    'X-TR-Url': creds.baseUrl,
    'X-TR-Email': creds.email,
    'X-TR-Key': creds.apiKey,
  }
}
