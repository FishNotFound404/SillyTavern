let csrfToken: string | null = null

export async function initCsrfToken(): Promise<void> {
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
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
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
