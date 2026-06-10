import './App.css'
import { AuthProvider, useAuth } from './auth'
import { Dashboard } from './Dashboard'
import { useState, type FormEvent } from 'react'

function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  )
}

function Main() {
  const auth = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (auth.isLoading) {
    return <div className="page-shell">Loading session...</div>
  }

  if (auth.user) {
    return <Dashboard />
  }

  const title = mode === 'login' ? 'Sign in' : 'Create account'
  const buttonLabel = mode === 'login' ? 'Login' : 'Register'
  const switchLabel = mode === 'login'
    ? 'Need an account? Register'
    : 'Already have an account? Sign in'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        await auth.login(email, password)
      } else {
        await auth.register(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="card">
        <h1>{title}</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </label>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Please wait…' : buttonLabel}
          </button>
        </form>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {switchLabel}
        </button>
      </div>
    </div>
  )
}

export default App
