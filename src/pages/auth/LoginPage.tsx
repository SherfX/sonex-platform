import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'

const STAFF_ROLES = new Set(['super_admin', 'admin', 'staff'])

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function redirectAfterLogin(userId: string) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (profile?.role && STAFF_ROLES.has(profile.role)) {
      navigate('/admin')
    } else {
      navigate('/portal')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    if (data.user) await redirectAfterLogin(data.user.id)
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError('Enter your email first')
      return
    }
    setLoading(true)
    setError('')
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() })
    setLoading(false)
    if (otpError) setError(otpError.message)
    else setError('Check your email for the magic link.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to website
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="section-eyebrow">Client access</p>
          <h1 className="mt-2 text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access your Sonex client portal</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {error && (
              <p
                className={`text-sm ${error.includes('Check your email') ? 'text-muted-foreground' : 'text-destructive'}`}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading}
            className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
          >
            Send magic link instead
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}