import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FileUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadEnquiryFile } from '../../lib/enquiries'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { buttonAccentClassName, inputClassName } from '../../components/ui/inputStyles'

export function NewEnquiryPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [projectTitle, setProjectTitle] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Please sign in again.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single()

    const { data: submission, error: insertError } = await supabase
      .from('project_submissions')
      .insert({
        full_name: profile?.full_name || user.email?.split('@')[0] || 'Client',
        email: profile?.email || user.email,
        phone: phone || profile?.phone,
        project_title: projectTitle.trim(),
        location: location.trim(),
        message: message.trim(),
        submitted_by: user.id,
        status: 'new',
      })
      .select('id')
      .single()

    if (insertError || !submission) {
      setError(insertError?.message || 'Could not submit enquiry.')
      setLoading(false)
      return
    }

    try {
      for (const file of files) {
        await uploadEnquiryFile(submission.id, file, user.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Some files failed to upload.')
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/portal', { state: { enquirySent: true } })
  }

  return (
    <div>
      <Link to="/portal" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>
      <PageHeader
        eyebrow="New project"
        title="Start enquiry / upload plans"
        description="Tell us about your project and attach drawings or documents. Our team will review and create your project in the portal."
      />

      <AppCard className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Project title"
            className={inputClassName}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className={inputClassName}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className={inputClassName}
          />
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Describe scope, timeline, and any notes for the team"
            className={inputClassName}
          />

          <div>
            <p className="text-sm font-medium">Plans & attachments</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground hover:border-accent/40">
              <FileUp className="h-8 w-8 text-accent" />
              {files.length
                ? `${files.length} file(s) selected`
                : 'PDF, images, or drawings — stored securely'}
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 text-xs text-muted-foreground">
                {files.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={loading} className={buttonAccentClassName}>
            {loading ? 'Submitting…' : 'Submit enquiry & plans'}
          </button>
        </form>
      </AppCard>
    </div>
  )
}