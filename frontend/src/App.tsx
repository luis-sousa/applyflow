import { AuthProvider, useAuth } from './auth'
import { Dashboard } from './Dashboard'
import { formatError } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        Loading session...
      </div>
    )
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
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Please wait…' : buttonLabel}
          </Button>
        </form>
        <Button
          type="button"
          variant="link"
          className="mt-2 w-full"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {switchLabel}
        </Button>
      </div>
    </div>
  )
}

export default App
