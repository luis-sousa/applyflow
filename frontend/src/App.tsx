import { AuthProvider, useAuth } from './auth'
import { Dashboard } from './Dashboard'
import { formatError } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'

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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  if (auth.isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <span>Loading session...</span>
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

  function validate() {
    const errors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      errors.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      errors.password = 'Please enter your password.'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!validate()) return
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
    <div className="relative flex min-h-svh items-center justify-center p-8">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!fieldErrors.email}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!fieldErrors.password}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {buttonLabel}
          </Button>
        </form>
        <Button
          type="button"
          variant="link"
          className="mt-2 w-full"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setFieldErrors({})
            setError(null)
          }}
        >
          {switchLabel}
        </Button>
      </div>
    </div>
  )
}

export default App
