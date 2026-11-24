import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Download, FolderKanban, Paperclip } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { buttonPrimaryClassName } from '../../components/ui/inputStyles'
import { ENQUIRY_STATUS, convertEnquiryToProject } from '../../lib/enquiries'
import { formatDateTime } from '../../lib/format'
import { cn } from '../../lib/utils'

type EnquiryFile = {
  id: string
  media_assets: { bucket: string; path: string; filename: string } | null
}

type Enquiry = {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  message: string
  project_title: string | null
  location: string | null
  status: string
  project_id: string | null
  submitted_by: string | null
  created_at: string
  submission_files?: EnquiryFile[]
}

const WORKFLOW = ['new', 'project_created', 'boq_shared'] as const

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('project_submissions')
      .select(
        `*,
        submission_files (
          id,
          media_assets (bucket, path, filename)
        )`,
      )
      .order('created_at', { ascending: false })
    setEnquiries((data as Enquiry[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function downloadFile(bucket: string, path: string, filename: string) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 120)
    if (error || !data?.signedUrl) return
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener'
    a.click()
  }

  async function handleConvert(enquiry: Enquiry) {
    setActionError('')
    setConvertingId(enquiry.id)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setActionError('You must be signed in.')
      setConvertingId(null)
      return
    }
    const result = await convertEnquiryToProject(enquiry.id, user.id)
    setConvertingId(null)
    if ('error' in result) {
      setActionError(result.error)
      return
    }
    await load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Enquiries"
        description="Portal and public submissions. Convert to a project, then share a BOQ when ready."
      />

      {actionError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : enquiries.length === 0 ? (
        <EmptyState title="No enquiries yet" description="New submissions will appear here." />
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => {
            const step = workflowStep(e.status)
            const files = e.submission_files || []
            return (
              <AppCard key={e.id} className="overflow-hidden p-0">
                <div className="border-b border-border/60 bg-muted/20 px-5 py-3">
                  <WorkflowStrip current={step} />
                </div>
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">
                        {e.project_title || e.full_name}
                      </h2>
                      <StatusBadge status={e.status || 'new'} />
                      {e.submitted_by && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Client portal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {e.full_name} · {e.email}
                      {e.phone ? ` · ${e.phone}` : ''}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed">{e.message}</p>

                    {files.length > 0 && (
                      <div className="mt-4">
                        <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5" />
                          Attachments
                        </p>
                        <ul className="mt-2 space-y-1">
                          {files.map((f) => {
                            const asset = f.media_assets
                            if (!asset) return null
                            return (
                              <li key={f.id}>
                                <button
                                  type="button"
                                  onClick={() => downloadFile(asset.bucket, asset.path, asset.filename)}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  {asset.filename}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
                    {e.project_id ? (
                      <>
                        <Link
                          to={`/admin/projects/${e.project_id}/boq`}
                          className={buttonPrimaryClassName}
                        >
                          Open BOQ editor
                        </Link>
                        <Link
                          to="/admin/projects"
                          className="text-center text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                          View in projects list
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={convertingId === e.id}
                        onClick={() => handleConvert(e)}
                        className={buttonPrimaryClassName}
                      >
                        <FolderKanban className="mr-2 inline h-4 w-4" />
                        {convertingId === e.id ? 'Creating project…' : 'Convert to project'}
                      </button>
                    )}
                  </div>
                </div>
              </AppCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

function workflowStep(status: string | null | undefined): number {
  const s = (status || 'new').toLowerCase()
  const idx = WORKFLOW.indexOf(s as (typeof WORKFLOW)[number])
  return idx >= 0 ? idx : 0
}

function WorkflowStrip({ current }: { current: number }) {
  const labels = Object.values(ENQUIRY_STATUS)
  return (
    <ol className="flex flex-wrap gap-2 sm:gap-4">
      {labels.map((label, i) => (
        <li
          key={label}
          className={cn(
            'flex items-center gap-2 text-xs font-semibold sm:text-sm',
            i <= current ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-[11px]',
              i < current
                ? 'bg-emerald-500 text-white'
                : i === current
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {i < current ? '✓' : i + 1}
          </span>
          {label}
          {i < labels.length - 1 && <span className="hidden text-muted-foreground sm:inline">→</span>}
        </li>
      ))}
    </ol>
  )
}
