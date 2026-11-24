import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolvePublicMediaUrl, type BackgroundSlotKey } from '../lib/media'

const SLOT_KEYS: BackgroundSlotKey[] = ['hero_background', 'cta_background', 'services_background']

export function useSiteBackgrounds() {
  const [urls, setUrls] = useState<Partial<Record<BackgroundSlotKey, string | null>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('site_content')
        .select('content_key, body')
        .in('content_key', SLOT_KEYS)

      const resolved: Partial<Record<BackgroundSlotKey, string | null>> = {}
      for (const key of SLOT_KEYS) {
        const row = data?.find((r) => r.content_key === key)
        const mediaId =
          row?.body && typeof row.body === 'object' && row.body !== null
            ? (row.body as { media_asset_id?: string | null }).media_asset_id
            : null
        resolved[key] = await resolvePublicMediaUrl(mediaId ?? null)
      }
      if (!cancelled) {
        setUrls(resolved)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { urls, loading }
}