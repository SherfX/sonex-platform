import { useEffect, useState } from 'react'
import { FileUp, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDateTime } from '../../lib/format'
import { AppCard } from '../ui/AppCard'
import { EmptyState } from '../ui/EmptyState'
import { buttonAccentClassName, inputClassName } from '../ui/inputStyles'
import { ListSkeleton } from '../ui/Skeleton'

type DocRow = {
  id: string
  title: string | null
  created_at: string
  media_assets: {
    filename: string
    path: string
    bucket: string
    mime_type: string | null
  } | null
}

export function ProjectDocuments({
  projectId,
  canUpload = true,
}: {
  projectId: string
  canUpload?: boolean
}) {
  const [docs, setDocs] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [projectId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('id, title, created_at, media_assets (filename, path, bucket, mime_type)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setDocs((data as unknown as DocRow[]) || [])
    setLoading(false)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a file to upload')
      return
    }
    setUploading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in')
      setUploading(false)
      return
    }

    const path = `${projectId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('client-documents').upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: media, error: mediaError } = await supabase
      .from('media_assets')
      .insert({
        bucket: 'client-documents',
        path,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
        is_public: false,
      })
      .select()
      .single()

    if (mediaError || !media) {
      setError(mediaError?.message || 'Could not save file record')
      setUploading(false)
      return
    }

    const { error: docError } = await supabase.from('documents').insert({
      project_id: projectId,
      title: title.trim() || file.name,
      media_asset_id: media.id,
      uploaded_by: user.id,
      is_client_visible: true,
    })

    if (docError) {
      setError(docError.message)
      setUploading(false)
      return
    }

    setTitle('')
    setFile(null)
    setUploading(false)
    load()
  }

  async function downloadDoc(doc: DocRow) {
    const asset = doc.media_assets
    if (!asset) return
    const { data, error: dlError } = await supabase.storage
      .from(asset.bucket)
      .download(asset.path)
    if (dlError || !data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = asset.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppCard>
      <h2 className="text-base font-semibold">Project documents</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Drawings, approvals, and files shared for this project.
      </p>

      {canUpload && (
        <form onSubmit={handleUpload} className="mt-5 space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title (optional)"
            className={inputClassName}
          />
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground transition hover:border-accent/50 hover:bg-accent/5">
            <FileUp className="h-8 w-8 text-accent" />
            <span>{file ? file.name : 'Tap to choose a file'}</span>
            <input
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={uploading} className={buttonAccentClassName}>
            {uploading ? 'Uploading…' : 'Upload document'}
          </button>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <ListSkeleton rows={2} />
        ) : docs.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Uploaded files will appear here for you and the Sonex team."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.title || doc.media_assets?.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(doc.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadDoc(doc)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppCard>
  )
}