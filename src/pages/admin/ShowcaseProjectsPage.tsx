import { useEffect, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { buttonAccentClassName, inputClassName } from '../../components/ui/inputStyles'
import {
  getStoragePublicUrl,
  uploadPublicSiteImage,
  type MediaAsset,
} from '../../lib/media'

type ShowcaseRow = {
  id: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
  media_asset_id: string | null
  media: MediaAsset | null
}

export function ShowcaseProjectsPage() {
  const [posts, setPosts] = useState<ShowcaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('showcase_posts')
      .select(
        `id, title, description, sort_order, is_published, media_asset_id,
         media:media_asset_id (id, bucket, path, filename, mime_type, alt_text, is_public)`,
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    const rows = ((data || []) as unknown[]).map((row) => {
      const r = row as ShowcaseRow
      const media = r.media as MediaAsset | MediaAsset[] | null
      return { ...r, media: Array.isArray(media) ? media[0] : media }
    })
    setPosts(rows)
    setLoading(false)
  }

  async function savePost(
    id: string,
    patch: Partial<Pick<ShowcaseRow, 'title' | 'description' | 'is_published' | 'sort_order'>>,
  ) {
    setSavingId(id)
    await supabase.from('showcase_posts').update(patch).eq('id', id)
    setSavingId(null)
    load()
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault()
    if (!draftTitle.trim()) return
    setCreating(true)

    let mediaId: string | null = null
    if (draftFile) {
      const asset = await uploadPublicSiteImage(draftFile, draftTitle.trim())
      mediaId = asset?.id ?? null
    }

    await supabase.from('showcase_posts').insert({
      title: draftTitle.trim(),
      description: draftDescription.trim() || null,
      media_asset_id: mediaId,
      sort_order: posts.length + 1,
      is_published: true,
    })

    setDraftTitle('')
    setDraftDescription('')
    setDraftFile(null)
    setCreating(false)
    load()
  }

  async function replaceImage(postId: string, file: File) {
    setSavingId(postId)
    const post = posts.find((p) => p.id === postId)
    const asset = await uploadPublicSiteImage(file, post?.title || 'Showcase')
    if (asset) {
      await supabase.from('showcase_posts').update({ media_asset_id: asset.id }).eq('id', postId)
    }
    setSavingId(null)
    load()
  }

  async function deletePost(post: ShowcaseRow) {
    if (!window.confirm(`Delete showcase post "${post.title}"?`)) return
    setSavingId(post.id)
    await supabase.from('showcase_posts').delete().eq('id', post.id)
    setSavingId(null)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Public website"
        title="Showcase gallery"
        description="Independent posts for the Our Work page — image, title, and description. Delivery projects stay in Projects."
      />

      <AppCard className="mb-8 border-accent/20 bg-gradient-to-br from-accent/5 to-card">
        <h2 className="text-base font-semibold">New showcase post</h2>
        <form onSubmit={createPost} className="mt-4 grid gap-4 lg:grid-cols-2">
          <input
            required
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Post title"
            className={inputClassName}
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm hover:border-accent/50">
            <ImagePlus className="h-4 w-4 text-accent" />
            {draftFile ? draftFile.name : 'Upload cover image'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setDraftFile(e.target.files?.[0] || null)}
            />
          </label>
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={3}
            placeholder="Description shown on the public card"
            className={`${inputClassName} lg:col-span-2`}
          />
          <button type="submit" disabled={creating} className={buttonAccentClassName}>
            {creating ? 'Publishing…' : 'Publish post'}
          </button>
        </form>
      </AppCard>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No showcase posts"
          description="Create your first post above. Visitors will see it on /work and the homepage gallery."
        />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const url =
              post.media?.is_public && post.media.path
                ? getStoragePublicUrl(post.media.bucket, post.media.path)
                : null
            return (
              <AppCard key={post.id} padding={false} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="relative h-48 w-full shrink-0 bg-muted md:h-auto md:w-56">
                    {url ? (
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-[12rem] items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <label className="absolute bottom-3 left-3 cursor-pointer rounded-lg bg-background/90 px-2 py-1 text-xs font-medium shadow">
                      {savingId === post.id ? 'Uploading…' : 'Change image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) replaceImage(post.id, f)
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <input
                      key={`title-${post.id}-${post.title}`}
                      defaultValue={post.title}
                      disabled={savingId === post.id}
                      onBlur={(e) => {
                        if (e.target.value !== post.title) savePost(post.id, { title: e.target.value })
                      }}
                      className={`${inputClassName} text-lg font-semibold`}
                    />
                    <textarea
                      key={`desc-${post.id}`}
                      defaultValue={post.description || ''}
                      rows={3}
                      disabled={savingId === post.id}
                      onBlur={(e) => {
                        const v = e.target.value
                        if (v !== (post.description || '')) savePost(post.id, { description: v })
                      }}
                      className={inputClassName}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={post.is_published}
                          disabled={savingId === post.id}
                          onChange={(e) => savePost(post.id, { is_published: e.target.checked })}
                        />
                        Visible on public site
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Order</span>
                        <input
                          type="number"
                          defaultValue={post.sort_order}
                          className={`${inputClassName} w-16 text-center`}
                          onBlur={(e) => {
                            const n = parseInt(e.target.value, 10)
                            if (!Number.isNaN(n) && n !== post.sort_order) savePost(post.id, { sort_order: n })
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => deletePost(post)}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
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