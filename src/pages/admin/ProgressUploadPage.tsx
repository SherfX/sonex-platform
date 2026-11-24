import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { formatDateTime } from '../../lib/format'
import { ProjectDocuments } from '../../components/documents/ProjectDocuments'
import { MessageThread, type ThreadMessage } from '../../components/messaging/MessageThread'
import { useConversationMessages } from '../../hooks/useConversationMessages'
import { signedUrlsForReportMedia } from '../../lib/progressMedia'
import { buttonAccentClassName, buttonPrimaryClassName, inputClassName } from '../../components/ui/inputStyles'

export function ProgressUploadPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [completionPct, setCompletionPct] = useState(0)
  const [savingPct, setSavingPct] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sendingMsg, setSendingMsg] = useState(false)

  const { messages, appendUnique } = useConversationMessages(conversationId)

  useEffect(() => {
    if (!id) return
    loadProject()
    loadReports()
    loadConversation()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [id])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`project-progress:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
        (payload) => {
          const row = payload.new as { completion_percentage?: number }
          if (typeof row.completion_percentage === 'number') {
            setCompletionPct(row.completion_percentage)
            setProject((p: any) => (p ? { ...p, completion_percentage: row.completion_percentage } : p))
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  async function loadProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(data)
    setCompletionPct(data?.completion_percentage ?? 0)
  }

  async function loadReports() {
    if (!id) return
    const { data } = await supabase
      .from('progress_reports')
      .select('*, progress_media(media_assets(*))')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    const list = data || []
    setReports(list)
    setPreviewUrls(await signedUrlsForReportMedia(list))
  }

  async function loadConversation() {
    if (!id) return
    let { data: conv } = await supabase.from('conversations').select('id').eq('project_id', id).limit(1).maybeSingle()
    if (!conv) {
      const { data: created } = await supabase
        .from('conversations')
        .insert({ project_id: id, title: 'Project discussion' })
        .select('id')
        .single()
      conv = created
    }
    setConversationId(conv?.id ?? null)
  }

  async function saveCompletionPct() {
    if (!id) return
    setSavingPct(true)
    const pct = Math.min(100, Math.max(0, Math.round(completionPct)))
    await supabase.from('projects').update({ completion_percentage: pct }).eq('id', id)
    setCompletionPct(pct)
    setSavingPct(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !title) return
    setUploading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pct = Math.min(100, Math.max(0, Math.round(completionPct)))

    const { data: report } = await supabase
      .from('progress_reports')
      .insert({
        project_id: id,
        author_id: user?.id,
        title,
        body,
        completion_percentage_at_time: pct,
        is_client_visible: true,
      })
      .select()
      .single()

    await supabase.from('projects').update({ completion_percentage: pct }).eq('id', id)

    if (file && report) {
      const filePath = `${id}/${Date.now()}-${file.name}`
      const { data: upload } = await supabase.storage.from('project-media').upload(filePath, file)

      if (upload) {
        const { data: media } = await supabase
          .from('media_assets')
          .insert({
            bucket: 'project-media',
            path: filePath,
            filename: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            uploaded_by: user?.id,
            is_public: false,
          })
          .select()
          .single()

        if (media) {
          await supabase.from('progress_media').insert({
            progress_report_id: report.id,
            media_asset_id: media.id,
          })
        }
      }
    }

    setTitle('')
    setBody('')
    setFile(null)
    setUploading(false)
    loadReports()
    loadProject()
  }

  async function sendMessage(body: string) {
    if (!conversationId || !userId) return
    setSendingMsg(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userId, body })
      .select('id, body, sender_id, created_at, profiles(full_name, email)')
      .single()
    if (!error && data) appendUnique(data as ThreadMessage)
    setSendingMsg(false)
  }

  return (
    <div className="space-y-8">
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All projects
      </Link>

      <PageHeader eyebrow="Site reporting" title="Progress & photos" description={project?.title} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard className="border-primary/15 bg-gradient-to-br from-primary/8 to-card shadow-md">
          <p className="text-sm font-medium text-muted-foreground">Overall completion</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={completionPct}
              onChange={(e) => setCompletionPct(Number(e.target.value))}
              className={`${inputClassName} w-24 text-2xl font-bold`}
            />
            <span className="pb-2 text-2xl font-bold text-muted-foreground">%</span>
            <button type="button" onClick={saveCompletionPct} disabled={savingPct} className={buttonPrimaryClassName}>
              {savingPct ? 'Saving…' : 'Update %'}
            </button>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Updating here or when publishing a report saves to the project — clients see this on their portal.
          </p>
        </AppCard>

        <AppCard className="shadow-md">
          <h2 className="text-base font-semibold">Publish update</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              required
              placeholder="Update title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
            />
            <textarea
              placeholder="What changed on site?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className={inputClassName}
            />
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground transition hover:border-accent/40 hover:bg-accent/5">
              <ImagePlus className="h-8 w-8 text-accent" />
              {file ? file.name : 'Add site photo (optional)'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" disabled={uploading} className={buttonAccentClassName}>
              {uploading ? 'Publishing…' : 'Publish update & sync %'}
            </button>
          </form>
        </AppCard>
      </div>

      <div>
        <h2 className="text-base font-semibold">Update history</h2>
        <div className="mt-4 space-y-4">
          {reports.map((r) => (
            <AppCard key={r.id} className="shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  {typeof r.completion_percentage_at_time === 'number' && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Recorded at {r.completion_percentage_at_time}%
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {(r.progress_media || []).map((pm: any) => {
                  const asset = pm.media_assets
                  const url = asset?.id ? previewUrls[asset.id] : undefined
                  if (url) {
                    return (
                      <img
                        key={asset.id}
                        src={url}
                        alt={asset.filename}
                        className="h-32 w-32 rounded-lg border object-cover shadow-sm"
                      />
                    )
                  }
                  return (
                    <div key={asset?.id} className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      {asset?.filename}
                    </div>
                  )
                })}
              </div>
            </AppCard>
          ))}
        </div>
      </div>

      {conversationId && (
        <MessageThread
          messages={messages}
          currentUserId={userId}
          staffView
          onSend={sendMessage}
          sending={sendingMsg}
          title="Project messages (client sees this)"
          maxHeightClass="max-h-[24rem]"
        />
      )}

      {id && <ProjectDocuments projectId={id} canUpload />}
    </div>
  )
}