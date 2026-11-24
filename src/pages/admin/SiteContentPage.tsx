import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ImageIcon, X, FileText, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { buttonPrimaryClassName, inputClassName } from '../../components/ui/inputStyles'
import {
  assignBackgroundImage,
  BACKGROUND_SLOTS,
  fetchPublicMediaLibrary,
  getStoragePublicUrl,
  uploadAndAssignBackground,
  type BackgroundSlotKey,
  type MediaAsset,
} from '../../lib/media'
import { cn } from '../../lib/utils'

type Tab = 'copy' | 'backgrounds'

const CONTENT_KEYS = new Set(['hero_background', 'cta_background', 'services_background'])

export function SiteContentPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('copy')
  const [content, setContent] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [library, setLibrary] = useState<MediaAsset[]>([])
  const [uploadingSlot, setUploadingSlot] = useState<BackgroundSlotKey | null>(null)
  const [slotSaving, setSlotSaving] = useState<BackgroundSlotKey | null>(null)
  const [assigned, setAssigned] = useState<Partial<Record<BackgroundSlotKey, string | null>>>({})

  useEffect(() => {
    load()
  }, [])

  async function loadSlotAssignments(contentRows: any[]) {
    const map: Partial<Record<BackgroundSlotKey, string | null>> = {}
    for (const slot of BACKGROUND_SLOTS) {
      const row = contentRows?.find((r) => r.content_key === slot.key)
      const mediaId =
        row?.body && typeof row.body === 'object' && !Array.isArray(row.body)
          ? (row.body as { media_asset_id?: string | null }).media_asset_id ?? null
          : null
      map[slot.key] = mediaId
    }
    setAssigned(map)
  }

  async function load() {
    setLoading(true)
    const { data: contentRows } = await supabase.from('site_content').select('*').order('content_key')
    setContent((contentRows || []).filter((c) => !CONTENT_KEYS.has(c.content_key)))
    await loadSlotAssignments(contentRows || [])
    setLibrary(await fetchPublicMediaLibrary())
    setLoading(false)
  }

  function startEdit(item: any) {
    setEditing(item)
    setTitle(item.title || '')
    setBody(typeof item.body === 'string' ? item.body : JSON.stringify(item.body, null, 2))
  }

  async function saveCopy() {
    if (!editing) return
    setSaving(true)
    let parsedBody: unknown = body
    try {
      parsedBody = JSON.parse(body)
    } catch {
      // keep string
    }
    await supabase.from('site_content').update({ title, body: parsedBody }).eq('id', editing.id)
    setSaving(false)
    setEditing(null)
    load()
  }

  async function assignSlot(slot: BackgroundSlotKey, mediaAssetId: string | null) {
    setSlotSaving(slot)
    await assignBackgroundImage(slot, mediaAssetId)
    await queryClient.invalidateQueries({ queryKey: ['site-backgrounds'] })
    setSlotSaving(null)
    load()
  }

  async function uploadDirectToSlot(slot: BackgroundSlotKey, file: File) {
    setUploadingSlot(slot)
    await uploadAndAssignBackground(slot, file)
    await queryClient.invalidateQueries({ queryKey: ['site-backgrounds'] })
    setUploadingSlot(null)
    load()
  }

  const previewUrl = (slot: BackgroundSlotKey) => {
    const id = assigned[slot]
    if (!id) return null
    const asset = library.find((a) => a.id === id)
    return asset ? getStoragePublicUrl(asset.bucket, asset.path) : null
  }

  return (
    <div>
      <PageHeader
        eyebrow="Public website"
        title="Site content & imagery"
        description="Each homepage section (hero, services, CTA) has its own background image assignment."
      />

      <div className="mb-6 flex gap-2 rounded-lg border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setTab('copy')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
            tab === 'copy' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FileText className="h-4 w-4" />
          Copy blocks
        </button>
        <button
          type="button"
          onClick={() => setTab('backgrounds')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
            tab === 'backgrounds' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ImageIcon className="h-4 w-4" />
          Background images
        </button>
      </div>

      {tab === 'copy' && (
        <>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : content.length === 0 ? (
            <EmptyState title="No content blocks" description="Seed site_content rows to edit homepage copy." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {content.map((item) => (
                <AppCard key={item.id} className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.content_key}</p>
                    <p className="mt-2 font-semibold">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {typeof item.body === 'object' ? JSON.stringify(item.body) : String(item.body)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="mt-4 self-start text-sm font-semibold text-primary hover:underline"
                  >
                    Edit content
                  </button>
                </AppCard>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'backgrounds' && (
        <div className="space-y-8">
          {BACKGROUND_SLOTS.map((slot) => {
            const currentPreview = previewUrl(slot.key)
            return (
              <AppCard key={slot.key}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{slot.key}</p>
                    <h2 className="mt-1 font-semibold">{slot.label}</h2>
                    <p className="text-sm text-muted-foreground">{slot.description}</p>
                    {assigned[slot.key] && (
                      <button
                        type="button"
                        disabled={slotSaving === slot.key}
                        onClick={() => assignSlot(slot.key, null)}
                        className="mt-2 text-sm text-destructive hover:underline"
                      >
                        Remove background for this section only
                      </button>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploadingSlot === slot.key ? 'Uploading…' : `Upload for ${slot.label} only`}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploadingSlot === slot.key}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadDirectToSlot(slot.key, f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {currentPreview && (
                  <BackgroundPreview url={currentPreview} label={`Current ${slot.label} background`} />
                )}

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Or pick from library (applies only to {slot.label})
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {library.map((asset) => {
                    const url = getStoragePublicUrl(asset.bucket, asset.path)
                    const selected = assigned[slot.key] === asset.id
                    return (
                      <button
                        key={`${slot.key}-${asset.id}`}
                        type="button"
                        disabled={slotSaving === slot.key}
                        onClick={() => assignSlot(slot.key, asset.id)}
                        className={cn(
                          'overflow-hidden rounded-lg border-2 text-left transition',
                          selected ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-border',
                        )}
                      >
                        <img
                          src={url}
                          alt={asset.alt_text || asset.filename}
                          className="aspect-video w-full object-cover"
                        />
                        <p className="truncate px-2 py-1 text-xs text-muted-foreground">{asset.filename}</p>
                      </button>
                    )
                  })}
                </div>
              </AppCard>
            )
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <AppCard className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto shadow-xl">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Editing {editing.content_key}
            </p>
            <h2 className="mt-1 text-lg font-bold">Update content</h2>
            <div className="mt-4 space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClassName} />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className={`${inputClassName} font-mono text-xs`}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="button" onClick={saveCopy} disabled={saving} className={buttonPrimaryClassName}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </AppCard>
        </div>
      )}
    </div>
  )
}

function BackgroundPreview({ url, label }: { url: string; label: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <img src={url} alt={label} className="max-h-40 w-full object-cover" />
      <p className="bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}