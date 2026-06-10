import * as api from '../api'

type GlobalFetch = typeof globalThis.fetch

type FetchResponse = {
  ok: boolean
  status: number
  statusText: string
  text: () => Promise<string>
}

function createJsonResponse(body: unknown, status = 200): FetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: async () => JSON.stringify(body)
  }
}

function createTextResponse(text: string, status = 200): FetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: async () => text
  }
}

describe('API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('performs a full CRUD flow for applications', async () => {
    const mockFetch = vi.fn()
    const token = 'test-token'
    const createdApp: api.Application = {
      id: 'app-1',
      title: 'Software Engineer',
      companyName: 'Acme Corp',
      status: 'Applied',
      appliedDate: new Date().toISOString(),
      notes: 'First submission'
    }

    mockFetch
      .mockResolvedValueOnce(createJsonResponse(createdApp, 201))
      .mockResolvedValueOnce(createJsonResponse([createdApp], 200))
      .mockResolvedValueOnce(createJsonResponse(createdApp, 200))
      .mockResolvedValueOnce(createJsonResponse({ ...createdApp, status: 'Interviewing' }, 200))
      .mockResolvedValueOnce(createTextResponse('', 204))

    vi.stubGlobal('fetch', mockFetch as unknown as GlobalFetch)

    const created = await api.createApplication(
      {
        title: createdApp.title,
        companyName: createdApp.companyName,
        status: createdApp.status,
        appliedDate: createdApp.appliedDate,
        notes: createdApp.notes
      },
      token
    )
    expect(created).toEqual(createdApp)

    const list = await api.listApplications(token)
    expect(list).toEqual([createdApp])

    const fetched = await api.getApplication(createdApp.id, token)
    expect(fetched).toEqual(createdApp)

    const updated = await api.updateApplication(createdApp.id, { status: 'Interviewing' }, token)
    expect(updated.status).toBe('Interviewing')

    await api.deleteApplication(createdApp.id, token)
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('returns a friendly message for authentication errors', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createJsonResponse({ message: 'Bad credentials' }, 401)
    )

    vi.stubGlobal('fetch', mockFetch as unknown as GlobalFetch)

    await expect(api.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
      'Bad credentials'
    )
  })

  it('formats fallback server errors when no JSON body is returned', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createTextResponse('Internal failure', 500)
    )

    vi.stubGlobal('fetch', mockFetch as unknown as GlobalFetch)

    await expect(api.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
      'Internal failure'
    )
  })
})
