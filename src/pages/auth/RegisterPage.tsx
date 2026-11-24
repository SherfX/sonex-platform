import { useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)
    if (error) setMessage(error.message)
    else
      setMessage(
        'Account created successfully. You can now sign in.',
      )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to website
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="section-eyebrow">New client</p>
        <h1 className="mt-2 text-2xl font-bold">Create account</h1>
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <input
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
          {message && (
            <p
              className={`text-sm ${message.includes('successfully') ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive'}`}
            >
              {message}
              {message.includes('successfully') && (
                <>
                  {' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
      </div>
    </div>
  )
}