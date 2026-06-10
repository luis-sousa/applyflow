// Frontend API client tests for ApplyFlow.
// These tests ensure the client properly handles CRUD operations and error formatting.
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

  // Verifies the full application CRUD flow via the API client uses the correct fetch calls and returns expected data.
  it('performs a full CRUD flow for applications', async () => {
    // Arrange
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

    // Act
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
    const list = await api.listApplications(token)
    const fetched = await api.getApplication(createdApp.id, token)
    const updated = await api.updateApplication(createdApp.id, { status: 'Interviewing' }, token)
    await api.deleteApplication(createdApp.id, token)

    // Assert
    expect(created).toEqual(createdApp)
    expect(list).toEqual([createdApp])
    expect(fetched).toEqual(createdApp)
    expect(updated.status).toBe('Interviewing')
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  // Verifies that authentication failures are surfaced as friendly error messages.
  it('returns a friendly message for authentication errors', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createJsonResponse({ message: 'Bad credentials' }, 401)
    )

    vi.stubGlobal('fetch', mockFetch as unknown as GlobalFetch)

    // Act & Assert
    await expect(api.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
      'Bad credentials'
    )
  })

  // Verifies that fallback server error text is returned when the response body is not JSON.
  it('formats fallback server errors when no JSON body is returned', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createTextResponse('Internal failure', 500)
    )

    vi.stubGlobal('fetch', mockFetch as unknown as GlobalFetch)

    // Act & Assert
    await expect(api.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
      'Internal failure'
    )
  })
})
