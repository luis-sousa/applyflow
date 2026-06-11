import { startRequest, endRequest } from './loadingStore'

export type AuthResponse = {
  token: string
  userId: string
  email: string
  createdAt: string
}

export type UserInfoResponse = {
  id: string
  email: string
  createdAt: string
}

export type Application = {
  id: string
  title: string
  companyName: string
  status: 'Applied' | 'Interviewing' | 'Offered' | 'Accepted' | 'Rejected'
  appliedDate: string
  notes: string | null
}

export type CreateApplicationRequest = Omit<Application, 'id'>
export type UpdateApplicationRequest = Partial<Omit<Application, 'id'>>

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type AuthRequest = {
  email: string
  password: string
}

const apiBaseUrl =
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env !== 'undefined'
    ? import.meta.env.VITE_API_BASE_URL ?? ''
    : ''

async function fetchJson<T>(
  path: string,
  init: RequestInit,
  token?: string
): Promise<T> {
  startRequest()
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(init.headers ?? {})
      },
      ...init
    })
  } finally {
    endRequest()
  }

  const text = await response.text()
  let data: unknown = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    let errorMessage = 'Request failed. Please try again.'

    if (response.status === 401 || response.status === 403) {
      errorMessage = 'Authentication failed. Please sign in again.'
    } else if (response.status === 404) {
      errorMessage = 'Resource not found.'
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.'
    }

    if (typeof data === 'object' && data !== null) {
      const body = data as Record<string, unknown>
      if (typeof body.error === 'string') {
        errorMessage = body.error
      } else if (typeof body.message === 'string') {
        errorMessage = body.message
      }
    } else if (typeof data === 'string' && data.length > 0) {
      errorMessage = data
    }

    throw new ApiError(errorMessage, response.status, data)
  }

  return data as T
}

// Auth APIs
export async function register(request: AuthRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(request)
    }
  )
}

export async function login(request: AuthRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(request)
    }
  )
}

export async function getMe(token: string): Promise<UserInfoResponse> {
  return fetchJson<UserInfoResponse>(
    '/api/auth/me',
    { method: 'GET' },
    token
  )
}

// Application APIs
export async function createApplication(
  request: CreateApplicationRequest,
  token: string
): Promise<Application> {
  return fetchJson<Application>(
    '/api/applications',
    {
      method: 'POST',
      body: JSON.stringify(request)
    },
    token
  )
}

export async function listApplications(token: string): Promise<Application[]> {
  return fetchJson<Application[]>(
    '/api/applications',
    { method: 'GET' },
    token
  )
}

export async function getApplication(
  id: string,
  token: string
): Promise<Application> {
  return fetchJson<Application>(
    `/api/applications/${id}`,
    { method: 'GET' },
    token
  )
}
export function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    if (error.message === 'Failed to fetch') {
      return 'Something went wrong on our end. Please try again later.'
    }
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}
export async function updateApplication(
  id: string,
  request: UpdateApplicationRequest,
  token: string
): Promise<Application> {
  return fetchJson<Application>(
    `/api/applications/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(request)
    },
    token
  )
}

export async function deleteApplication(
  id: string,
  token: string
): Promise<void> {
  await fetchJson<void>(
    `/api/applications/${id}`,
    { method: 'DELETE' },
    token
  )
}
