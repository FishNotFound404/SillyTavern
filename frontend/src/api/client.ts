let csrfToken: string | null = null
let csrfPromise: Promise<void> | null = null

export class ApiError extends Error {
  status: number
  response?: Response

  constructor(
    status: number,
    message: string,
    response?: Response,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

export function getCsrfToken(): string | null {
  return csrfToken
}

export async function initCsrfToken(): Promise<void> {
  if (csrfPromise) {
    return csrfPromise
  }

  csrfPromise = (async () => {
    try {
      const res = await fetch('/csrf-token')
      if (!res.ok) {
        console.warn('Failed to fetch CSRF token:', res.status)
        return
      }
      const data = await res.json()
      csrfToken = data.token || null
    } catch (err) {
      console.warn('Error fetching CSRF token:', err)
    }
  })()

  return csrfPromise
}

async function ensureCsrf(headers: Record<string, string>): Promise<void> {
  await initCsrfToken()
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }
}

async function readErrorBody(res: Response): Promise<string> {
  return res.text().catch(() => '')
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await readErrorBody(res)
    throw new ApiError(res.status, `HTTP ${res.status}: ${text}`, res)
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  await ensureCsrf(headers)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const text = await readErrorBody(res)
    throw new ApiError(res.status, `HTTP ${res.status}: ${text}`, res)
  }

  return res.json() as Promise<T>
}

export async function apiPostForm<T>(url: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {}
  await ensureCsrf(headers)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    signal,
  })

  if (!res.ok) {
    const text = await readErrorBody(res)
    throw new ApiError(res.status, `HTTP ${res.status}: ${text}`, res)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }

  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}
