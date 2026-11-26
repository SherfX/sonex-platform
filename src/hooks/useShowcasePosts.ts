import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getStoragePublicUrl } from '../lib/media'

export type ShowcasePost = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  imageAlt: string | null
}

export function useShowcasePosts(limit?: number) {
  const [posts, setPosts] = useState<ShowcasePost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let query = supabase
        .from('showcase_posts')
        .select(
          `id, title, description, sort_order,
           media:media_asset_id (id, bucket, path, filename, alt_text, is_public)`,
        )
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (limit) query = query.limit(limit)

      const { data } = await query
      const mapped = (data || []).map((row: any) => {
        const asset = Array.isArray(row.media) ? row.media[0] : row.media
        const imageUrl =
          asset?.is_public && asset.bucket && asset.path
            ? getStoragePublicUrl(asset.bucket, asset.path)
            : null
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          imageUrl,
          imageAlt: asset?.alt_text || asset?.filename || row.title,
        }
      })
      if (!cancelled) {
        setPosts(mapped)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [limit])

  return { posts, loading }
}