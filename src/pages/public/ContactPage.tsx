import { useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { notifyEnquiryByEmail } from '../../lib/email'

export function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)

    const payload = {
      full_name: String(form.get('full_name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      company: String(form.get('company') ?? '').trim(),
      message: String(form.get('message') ?? '').trim(),
    }

    const { error: insertError } = await supabase.from('project_submissions').insert(payload)

    if (insertError) {
      setLoading(false)
      setError(insertError.message || 'Could not submit your enquiry. Please try again.')
      return
    }

    try {
      await notifyEnquiryByEmail(payload)
    } catch {
      // Enquiry saved even if email fails
    }

    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-24 text-center">
        <p className="section-eyebrow">Enquiry received</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Thank you</h1>
        <p className="mt-4 text-muted-foreground">
          We&apos;ve received your enquiry and will be in touch shortly. A confirmation has been
          sent to your email when delivery is configured.
        </p>
        <Link to="/" className="mt-8 inline-block text-sm font-medium text-primary hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div>
      <section className="page-hero border-b border-border/60">
        <div className="container mx-auto px-4">
          <p className="section-eyebrow">Contact</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Start a project
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Tell us about your location, scope, and timeline. We&apos;ll review and follow up with
            clear next steps.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-xl px-4 py-16 md:py-20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="full_name"
            required
            placeholder="Full name"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm"
          />
          <input
            name="phone"
            placeholder="Phone"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm"
          />
          <input
            name="company"
            placeholder="Company (optional)"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm"
          />
          <textarea
            name="message"
            required
            placeholder="Tell us about your project"
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm"
          />
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Submit enquiry'}
          </button>
        </form>
      </section>
    </div>
  )
}