type AuthRequest = {
  email: string
  password: string
}

type AuthResponse = {
  token: string
  userId: string
  email: string
  createdAt: string
}

type UserInfoResponse = {
  id: string
  email: string
  createdAt: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    },
    ...init
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || response.statusText
    throw new Error(errorMessage ?? 'Request failed')
  }

  return data as T
}

export async function register(request: AuthRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export async function login(request: AuthRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export async function getMe(token: string): Promise<UserInfoResponse> {
  return fetchJson<UserInfoResponse>('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export type { AuthResponse, UserInfoResponse }
