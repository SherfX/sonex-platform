import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { inputClassName } from '../../components/ui/inputStyles'
import {
  fetchPublicMediaLibrary,
  getStoragePublicUrl,
  uploadPublicSiteImage,
  type MediaAsset,
} from '../../lib/media'
import { cn } from '../../lib/utils'

type ProjectRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  status: string
  is_public: boolean
  cover_media_id: string | null
  cover_media: MediaAsset | null
}

export function ShowcaseProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [library, setLibrary] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [uploadForId, setUploadForId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select(
        `id, title, description, location, status, is_public, cover_media_id,
         cover_media:cover_media_id (id, bucket, path, filename, mime_type, alt_text, is_public)`,
      )
      .order('updated_at', { ascending: false })
    const rows = ((data || []) as unknown as ProjectRow[]).map((row) => ({
      ...row,
      cover_media: Array.isArray(row.cover_media) ? row.cover_media[0] : row.cover_media,
    }))
    setProjects(rows)
    setLibrary(await fetchPublicMediaLibrary())
    setLoading(false)
  }

  async function updateProject(
    id: string,
    fields: { is_public?: boolean; description?: string; cover_media_id?: string | null },
  ) {
    setSavingId(id)
    await supabase.from('projects').update(fields).eq('id', id)
    setSavingId(null)
    load()
  }

  async function uploadCover(projectId: string, file: File) {
    setUploadForId(projectId)
    const asset = await uploadPublicSiteImage(file, `Cover — project ${projectId}`)
    if (asset) {
      await updateProject(projectId, { cover_media_id: asset.id, is_public: true })
    }
    setUploadForId(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Public website"
        title="Showcase projects"
        description="Choose which projects appear on /work and set cover images from media_assets."
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects" description="Create projects in Supabase to manage showcase visibility." />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const cover = p.cover_media
            const coverUrl =
              cover?.is_public && cover.bucket && cover.path
                ? getStoragePublicUrl(cover.bucket, cover.path)
                : null
            return (
              <AppCard key={p.id}>
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/15 to-muted lg:w-48">
                    {coverUrl ? (
                      <img src={coverUrl} alt={cover?.alt_text || p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No cover image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{p.title}</h2>
                      <StatusBadge status={p.status} />
                      {p.is_public && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                          On showcase
                        </span>
                      )}
                    </div>
                    {p.location && <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>}
                    <textarea
                      defaultValue={p.description || ''}
                      rows={2}
                      placeholder="Short public description"
                      className={`${inputClassName} mt-3`}
                      onBlur={(e) => {
                        if (e.target.value !== (p.description || '')) {
                          updateProject(p.id, { description: e.target.value })
                        }
                      }}
                    />
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={p.is_public}
                        disabled={savingId === p.id}
                        onChange={(e) => updateProject(p.id, { is_public: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      Show on public Our Work page
                    </label>
                  </div>
                  <div className="lg:w-56">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover image</p>
                    <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs hover:border-accent">
                      <ImagePlus className="h-4 w-4 text-accent" />
                      {uploadForId === p.id ? 'Uploading…' : 'Upload new'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploadCover(p.id, f)
                        }}
                      />
                    </label>
                    <CoverImagePicker
                      library={library}
                      selectedId={p.cover_media_id}
                      saving={savingId === p.id}
                      onSelect={(assetId) => updateProject(p.id, { cover_media_id: assetId })}
                    />
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

function CoverImagePicker({
  library,
  selectedId,
  saving,
  onSelect,
}: {
  library: MediaAsset[]
  selectedId: string | null
  saving: boolean
  onSelect: (id: string) => void
}) {
  if (library.length === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">Upload images under Content → Backgrounds.</p>
  }
  return (
    <div className="mt-2 grid max-h-40 grid-cols-3 gap-1 overflow-y-auto">
      {library.map((asset) => (
        <button
          key={asset.id}
          type="button"
          disabled={saving}
          onClick={() => onSelect(asset.id)}
          className={cn(
            'overflow-hidden rounded border',
            selectedId === asset.id ? 'border-accent ring-1 ring-accent' : 'border-transparent',
          )}
        >
          <img
            src={getStoragePublicUrl(asset.bucket, asset.path)}
            alt=""
            className="aspect-square object-cover"
          />
        </button>
      ))}
    </div>
  )
}