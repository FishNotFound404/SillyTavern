import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createTestQueryClient,
  http,
  HttpResponse,
} from '../../../test/utils'
import { createWrapper } from '../../../test/test-wrapper'
import { server } from '../../../test/msw-server'
import Personas from './Personas'

const emptyBundle = { settings: '{}' }

function personaBundle(
  personas: Array<{ id: string; name: string; description?: string; avatar: string }>,
  defaultId: string | null = personas[0]?.id ?? null,
) {
  return {
    settings: JSON.stringify({
      reactPersonas: { personas, defaultId },
    }),
  }
}

describe('Personas page', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    user = userEvent.setup()
    server.use(
      http.get('/csrf-token', () => HttpResponse.json({ token: 'test-csrf-token' })),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function renderPage() {
    return render(<Personas />, { wrapper: createWrapper(queryClient) })
  }

  it('renders existing personas and the create form', async () => {
    server.use(
      http.post('/api/settings/get', () =>
        HttpResponse.json(
          personaBundle([
            { id: 'p1', name: 'Alice', description: 'A test', avatar: 'alice.png' },
          ]),
        ),
      ),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Your Personas' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Default')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('Persona name')
    expect(nameInput).toBeInTheDocument()
    expect(nameInput).toBeInstanceOf(HTMLInputElement)

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInstanceOf(HTMLInputElement)

    const description = screen.getByPlaceholderText(/description/i)
    expect(description).toBeInstanceOf(HTMLTextAreaElement)

    expect(
      screen.getByRole('button', { name: /create persona/i }),
    ).toBeInTheDocument()
  })

  it('creates a new persona by uploading an avatar then saving the bundle', async () => {
    let currentBundle = emptyBundle
    let uploadFormData: FormData | null = null
    let saveBody: Record<string, unknown> | null = null
    let uploadCalledAt: number | null = null
    let saveCalledAt: number | null = null

    server.use(
      http.post('/api/settings/get', () => HttpResponse.json(currentBundle)),
      http.post('/api/avatars/upload', async ({ request }) => {
        uploadCalledAt = Date.now()
        uploadFormData = await request.formData()
        return HttpResponse.json({ path: 'new.png' })
      }),
      http.post('/api/settings/save', async ({ request }) => {
        saveBody = (await request.json()) as Record<string, unknown>
        saveCalledAt = Date.now()
        currentBundle = { settings: JSON.stringify(saveBody) }
        return HttpResponse.json(currentBundle)
      }),
    )

    renderPage()

    expect(
      await screen.findByText('No personas yet. Create one above.'),
    ).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Persona name'), 'Bob')

    const file = new File(['avatar-bytes'], 'avatar.png', { type: 'image/png' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await user.click(screen.getByRole('button', { name: /create persona/i }))

    expect(await screen.findByText('Bob')).toBeInTheDocument()

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Persona name') as HTMLInputElement).value,
      ).toBe('')
    })

    expect(uploadFormData).not.toBeNull()
    const uploadedFile = uploadFormData!.get('avatar')
    expect(uploadedFile).toBeInstanceOf(File)
    expect((uploadedFile as File).name).toBe('avatar.png')

    expect(saveBody).not.toBeNull()
    const reactPersonas = saveBody!.reactPersonas as {
      personas: Array<{ id: string; name: string; avatar: string }>
      defaultId: string | null
    }
    expect(reactPersonas.personas).toHaveLength(1)
    expect(reactPersonas.personas[0]?.name).toBe('Bob')
    expect(reactPersonas.personas[0]?.avatar).toBe('new.png')
    expect(reactPersonas.defaultId).toBe(reactPersonas.personas[0]?.id)

    expect(uploadCalledAt).not.toBeNull()
    expect(saveCalledAt).not.toBeNull()
    expect(uploadCalledAt!).toBeLessThanOrEqual(saveCalledAt!)
  })

  it('deletes a persona by calling avatars/delete then saving with the persona removed', async () => {
    let currentBundle = personaBundle([
      { id: 'p1', name: 'Alice', description: 'A test', avatar: 'alice.png' },
    ])
    let deleteBody: Record<string, unknown> | null = null
    let saveBody: Record<string, unknown> | null = null
    let deleteCalledAt: number | null = null
    let saveCalledAt: number | null = null

    server.use(
      http.post('/api/settings/get', () => HttpResponse.json(currentBundle)),
      http.post('/api/avatars/delete', async ({ request }) => {
        deleteBody = (await request.json()) as Record<string, unknown>
        deleteCalledAt = Date.now()
        return HttpResponse.json({ ok: true })
      }),
      http.post('/api/settings/save', async ({ request }) => {
        saveBody = (await request.json()) as Record<string, unknown>
        saveCalledAt = Date.now()
        currentBundle = { settings: JSON.stringify(saveBody) }
        return HttpResponse.json(currentBundle)
      }),
    )

    if (typeof window.confirm !== 'function') {
      Object.defineProperty(window, 'confirm', {
        value: () => true,
        writable: true,
        configurable: true,
      })
    }
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    expect(await screen.findByText('Alice')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    })

    expect(deleteBody).toEqual({ avatar: 'alice.png' })

    expect(saveBody).not.toBeNull()
    const reactPersonas = saveBody!.reactPersonas as {
      personas: unknown[]
      defaultId: string | null
    }
    expect(reactPersonas.personas).toHaveLength(0)
    expect(reactPersonas.defaultId).toBeNull()

    expect(deleteCalledAt).not.toBeNull()
    expect(saveCalledAt).not.toBeNull()
    expect(deleteCalledAt!).toBeLessThanOrEqual(saveCalledAt!)
  })
})
