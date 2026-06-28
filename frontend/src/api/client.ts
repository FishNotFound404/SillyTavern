let csrfToken: string | null = null
let csrfPromise: Promise<void> | null = null

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

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiPost<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  await initCsrfToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return res.json()
}

export async function apiPostForm<T>(url: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  await initCsrfToken()

  const headers: Record<string, string> = {}

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    signal,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
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
