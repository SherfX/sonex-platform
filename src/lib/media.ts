import { supabase } from './supabase'

export type MediaAsset = {
  id: string
  bucket: string
  path: string
  filename: string
  mime_type: string | null
  alt_text: string | null
  is_public: boolean
}

export function getStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function fetchMediaAsset(id: string): Promise<MediaAsset | null> {
  const { data } = await supabase.from('media_assets').select('*').eq('id', id).maybeSingle()
  return data as MediaAsset | null
}

/** Public site URL — only when asset is public (typically public-media bucket). */
export async function resolvePublicMediaUrl(mediaAssetId: string | null | undefined): Promise<string | null> {
  if (!mediaAssetId) return null
  const asset = await fetchMediaAsset(mediaAssetId)
  if (!asset?.is_public) return null
  return getStoragePublicUrl(asset.bucket, asset.path)
}

export async function resolveBackgroundUrlsBySlot(): Promise<
  Record<BackgroundSlotKey, string | null>
> {
  const out = {
    hero_background: null,
    cta_background: null,
    services_background: null,
  } as Record<BackgroundSlotKey, string | null>

  for (const slot of BACKGROUND_SLOTS) {
    const { data: row } = await supabase
      .from('site_content')
      .select('body')
      .eq('content_key', slot.key)
      .maybeSingle()

    let mediaId: string | null = null
    if (row?.body && typeof row.body === 'object' && row.body !== null && !Array.isArray(row.body)) {
      const id = (row.body as { media_asset_id?: string | null }).media_asset_id
      mediaId = id ?? null
    }
    out[slot.key] = await resolvePublicMediaUrl(mediaId)
  }

  return out
}

export async function fetchPublicMediaLibrary(): Promise<MediaAsset[]> {
  const { data } = await supabase
    .from('media_assets')
    .select('id, bucket, path, filename, mime_type, alt_text, is_public')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  return (data as MediaAsset[]) || []
}

export async function uploadPublicSiteImage(file: File, altText?: string): Promise<MediaAsset | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const path = `site/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const { error: uploadError } = await supabase.storage.from('public-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) {
    console.error(uploadError)
    return null
  }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      bucket: 'public-media',
      path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
      is_public: true,
      alt_text: altText || file.name,
    })
    .select('id, bucket, path, filename, mime_type, alt_text, is_public')
    .single()

  if (error) return null
  return data as MediaAsset
}

export type BackgroundSlotKey = 'hero_background' | 'cta_background' | 'services_background'

export const BACKGROUND_SLOTS: { key: BackgroundSlotKey; label: string; description: string }[] = [
  { key: 'hero_background', label: 'Hero', description: 'Homepage masthead behind the main headline.' },
  { key: 'cta_background', label: 'CTA band', description: '“Ready to start your project?” section.' },
  { key: 'services_background', label: 'Services', description: 'Optional backdrop for the services grid.' },
]

/** Assign one image to exactly one slot — never shares with other slots. */
export async function assignBackgroundImage(slotKey: BackgroundSlotKey, mediaAssetId: string | null) {
  const slotMeta = BACKGROUND_SLOTS.find((s) => s.key === slotKey)
  const body = {
    media_asset_id: mediaAssetId,
    label: slotMeta?.label ?? slotKey,
  }

  const { data: existing } = await supabase
    .from('site_content')
    .select('id')
    .eq('content_key', slotKey)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('site_content')
      .update({ title: slotMeta?.label, body })
      .eq('content_key', slotKey)
  } else {
    await supabase.from('site_content').insert({
      content_key: slotKey,
      title: slotMeta?.label,
      body,
      is_published: true,
    })
  }
}

export async function uploadAndAssignBackground(
  slotKey: BackgroundSlotKey,
  file: File,
): Promise<MediaAsset | null> {
  const asset = await uploadPublicSiteImage(file, `${slotKey} background`)
  if (!asset) return null
  await assignBackgroundImage(slotKey, asset.id)
  return asset
}