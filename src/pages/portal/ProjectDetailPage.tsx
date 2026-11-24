import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { FileSpreadsheet, ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageLoader } from '../../components/ui/PageLoader'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AppCard } from '../../components/ui/AppCard'
import { MessageThread, type ThreadMessage } from '../../components/messaging/MessageThread'
import { ProjectDocuments } from '../../components/documents/ProjectDocuments'
import { useConversationMessages } from '../../hooks/useConversationMessages'
import { signedUrlsForReportMedia } from '../../lib/progressMedia'
import { formatDateTime } from '../../lib/format'
import { buttonAccentClassName } from '../../components/ui/inputStyles'

export function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const { messages, appendUnique } = useConversationMessages(conversationId)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`portal-project:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
        (payload) => {
          const row = payload.new as { completion_percentage?: number; status?: string }
          setProject((p: any) =>
            p
              ? {
                  ...p,
                  completion_percentage: row.completion_percentage ?? p.completion_percentage,
                  status: row.status ?? p.status,
                }
              : p,
          )
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  async function loadReports() {
    if (!id) return
    const { data } = await supabase
      .from('progress_reports')
      .select('*, progress_media(media_assets(*))')
      .eq('project_id', id)
      .eq('is_client_visible', true)
      .order('created_at', { ascending: false })
    const list = data || []
    setReports(list)
    setPreviewUrls(await signedUrlsForReportMedia(list))
  }

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUserId(user?.id || null)

    const { data: projectData } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(projectData)

    const { data: milestoneData } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', id)
      .eq('is_client_visible', true)
      .order('sort_order')
    setMilestones(milestoneData || [])

    await loadReports()

    let { data: conv } = await supabase.from('conversations').select('id').eq('project_id', id).limit(1).maybeSingle()

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ project_id: id, title: 'Project discussion' })
        .select('id')
        .single()
      conv = newConv
    }

    setConversationId(conv?.id ?? null)
    setLoading(false)
  }

  async function sendMessage(body: string) {
    if (!conversationId || !userId) return
    setSending(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userId, body })
      .select('id, body, sender_id, created_at, profiles(full_name, email)')
      .single()
    if (!error && data) appendUnique(data as ThreadMessage)
    setSending(false)
  }

  if (loading) return <PageLoader label="Loading project…" />
  if (!project || !id) {
    return (
      <AppCard>
        <p className="text-muted-foreground">Project not found or you do not have access.</p>
        <Link to="/portal" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Back to projects
        </Link>
      </AppCard>
    )
  }

  const pct = project.completion_percentage ?? 0

  return (
    <div className="space-y-8">
      <Link
        to="/portal"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All projects
      </Link>

      <PageHeader
        title={project.title}
        description={project.location || undefined}
        actions={
          <>
            <StatusBadge status={project.status} />
            <Link to={`/portal/projects/${id}/boq`} className={buttonAccentClassName}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              View BOQ
            </Link>
          </>
        }
      />

      <AppCard className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 shadow-md">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Construction progress</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{pct}%</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {project.description && (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        )}
      </AppCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard className="shadow-md">
          <h2 className="text-base font-semibold">Milestones & site updates</h2>
          {milestones.length === 0 && reports.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No published updates yet — check back soon.</p>
          ) : (
            <ul className="mt-4 space-y-5">
              {milestones.map((m) => (
                <li key={m.id} className="flex gap-3 border-l-2 border-accent pl-3">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    {m.completed_at && (
                      <span className="text-xs font-medium text-emerald-600">Completed</span>
                    )}
                  </div>
                </li>
              ))}
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-border/60 bg-muted/15 p-4">
                  <p className="font-semibold">{r.title}</p>
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                  {(r.progress_media || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(r.progress_media || []).map((pm: any) => {
                        const asset = pm.media_assets
                        const url = asset?.id ? previewUrls[asset.id] : undefined
                        if (!url) return null
                        return (
                          <a key={asset.id} href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={asset.filename}
                              className="h-28 w-28 rounded-lg border object-cover shadow-sm transition hover:opacity-90"
                            />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AppCard>

        <MessageThread
          messages={messages}
          currentUserId={userId}
          onSend={sendMessage}
          sending={sending}
          title="Project team chat"
          emptyLabel="Message your Sonex project team — we typically respond within one business day."
          className="shadow-md"
        />
      </div>

      <ProjectDocuments projectId={id} canUpload />
    </div>
  )
}