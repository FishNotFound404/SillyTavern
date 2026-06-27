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

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
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
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return res.json()
}
