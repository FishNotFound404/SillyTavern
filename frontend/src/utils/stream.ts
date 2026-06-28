import { initCsrfToken } from '../api/client'
import { extractStreamDelta } from './connection'

function splitSseEvents(text: string): { events: string[]; remainder: string } {
  const parts = text.split(/\r\n\r\n|\r\r|\n\n/g)
  const remainder = parts.pop() || ''
  return { events: parts, remainder }
}

function extractData(event: string): string {
  const lines = event.split(/\r\n|\r|\n/g)
  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
  return dataLines.join('\n')
}

async function* parseSseStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (value) {
      buffer += decoder.decode(value, { stream: !done })
    }

    const { events, remainder } = splitSseEvents(buffer)
    buffer = remainder

    for (const event of events) {
      const data = extractData(event)
      if (data === '') continue
      if (data === '[DONE]') return
      yield data
    }

    if (done) {
      // Process any trailing data that never got a terminating blank line.
      if (buffer) {
        const data = extractData(buffer)
        if (data && data !== '[DONE]') {
          yield data
        }
      }
      break
    }
  }
}

export async function* streamCompletion(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  await initCsrfToken()

  const tokenResponse = await fetch('/csrf-token')
  let csrfToken: string | undefined
  if (tokenResponse.ok) {
    const tokenData = (await tokenResponse.json()) as { token?: string }
    csrfToken = tokenData.token
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  for await (const data of parseSseStream(reader)) {
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>
      const delta = extractStreamDelta(parsed)
      if (delta) {
        yield delta
      }
    } catch {
      // Skip malformed chunks; some providers send comments or empty data lines.
      continue
    }
  }
}
