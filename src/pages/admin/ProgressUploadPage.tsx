import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { formatDateTime } from '../../lib/format'
import { ProjectDocuments } from '../../components/documents/ProjectDocuments'
import { buttonAccentClassName, inputClassName } from '../../components/ui/inputStyles'

export function ProgressUploadPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setProject(data))
    loadReports()
  }, [id])

  async function loadReports() {
    if (!id) return
    const { data } = await supabase
      .from('progress_reports')
      .select('*, progress_media(media_assets(*))')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    const list = data || []
    setReports(list)

    const urls: Record<string, string> = {}
    for (const r of list) {
      for (const pm of r.progress_media || []) {
        const asset = pm.media_assets
        if (!asset?.path || !asset.mime_type?.startsWith('image/')) continue
        const { data: signed } = await supabase.storage
          .from(asset.bucket)
          .createSignedUrl(asset.path, 3600)
        if (signed?.signedUrl) urls[asset.id] = signed.signedUrl
      }
    }
    setPreviewUrls(urls)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !title) return
    setUploading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: report } = await supabase
      .from('progress_reports')
      .insert({
        project_id: id,
        author_id: user?.id,
        title,
        body,
        is_client_visible: true,
      })
      .select()
      .single()

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

      <PageHeader
        eyebrow="Site reporting"
        title="Progress & photos"
        description={project?.title}
      />

      <AppCard>
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
            {uploading ? 'Publishing…' : 'Publish update'}
          </button>
        </form>
      </AppCard>

      <div>
        <h2 className="text-base font-semibold">Update history</h2>
        <div className="mt-4 space-y-4">
          {reports.map((r) => (
            <AppCard key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
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
                        className="h-28 w-28 rounded-lg border object-cover shadow-sm"
                      />
                    )
                  }
                  return (
                    <div
                      key={asset?.id}
                      className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                    >
                      {asset?.filename}
                    </div>
                  )
                })}
              </div>
            </AppCard>
          ))}
        </div>
      </div>

      {id && <ProjectDocuments projectId={id} canUpload />}
    </div>
  )
}