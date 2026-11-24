import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useParams } from 'react-router'
import { FileSpreadsheet, ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageLoader } from '../../components/ui/PageLoader'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AppCard } from '../../components/ui/AppCard'
import { MessageThread, type ThreadMessage } from '../../components/messaging/MessageThread'
import { ProjectDocuments } from '../../components/documents/ProjectDocuments'
import { formatDateTime } from '../../lib/format'
import { buttonAccentClassName } from '../../components/ui/inputStyles'

export function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

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

    const { data: reportData } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('project_id', id)
      .eq('is_client_visible', true)
      .order('created_at', { ascending: false })
    setReports(reportData || [])

    let { data: conv } = await supabase.from('conversations').select('id').eq('project_id', id).limit(1).single()

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ project_id: id, title: 'Project discussion' })
        .select('id')
        .single()
      conv = newConv
    }

    if (conv) {
      setConversationId(conv.id)
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, body, sender_id, created_at, profiles(full_name, email)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })
      setMessages((msgs as ThreadMessage[]) || [])
    }

    setLoading(false)
  }

  async function sendMessage(body: string) {
    if (!conversationId || !userId) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    })
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at, profiles(full_name, email)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages((msgs as ThreadMessage[]) || [])
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

      <AppCard className="bg-gradient-to-br from-primary/5 to-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Construction progress</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{project.completion_percentage}%</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
            style={{ width: `${project.completion_percentage}%` }}
          />
        </div>
        {project.description && (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        )}
      </AppCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <h2 className="text-base font-semibold">Milestones & updates</h2>
          {milestones.length === 0 && reports.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No published updates yet — check back soon.</p>
          ) : (
            <ul className="mt-4 space-y-4">
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
                <li key={r.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="font-medium">{r.title}</p>
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
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
        />
      </div>

      <ProjectDocuments projectId={id} canUpload />
    </div>
  )
}