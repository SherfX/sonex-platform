import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getStoragePublicUrl } from '../lib/media'
import type { MediaAsset } from '../lib/media'

export type ShowcaseProject = {
  id: string
  title: string
  description: string | null
  location: string | null
  status: string
  completion_percentage: number
  is_public: boolean
  coverUrl: string | null
  coverAlt: string | null
}

type RawProject = {
  id: string
  title: string
  description: string | null
  location: string | null
  status: string
  completion_percentage: number
  is_public: boolean
  cover_media: MediaAsset | MediaAsset[] | null
}

function coverFromRow(cover: RawProject['cover_media']): { url: string | null; alt: string | null } {
  const asset = Array.isArray(cover) ? cover[0] : cover
  if (!asset?.is_public) return { url: null, alt: null }
  return {
    url: getStoragePublicUrl(asset.bucket, asset.path),
    alt: asset.alt_text || asset.filename,
  }
}

export function useShowcaseProjects(limit?: number) {
  const [projects, setProjects] = useState<ShowcaseProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let query = supabase
        .from('projects')
        .select(
          `id, title, description, location, status, completion_percentage, is_public,
           cover_media:cover_media_id (id, bucket, path, filename, mime_type, alt_text, is_public)`,
        )
        .or('is_public.eq.true,status.eq.completed')
        .neq('status', 'draft')
        .order('updated_at', { ascending: false })

      if (limit) query = query.limit(limit)

      const { data } = await query
      const mapped = (data as RawProject[] | null)?.map((p) => {
        const { url, alt } = coverFromRow(p.cover_media)
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          location: p.location,
          status: p.status,
          completion_percentage: p.completion_percentage,
          is_public: p.is_public,
          coverUrl: url,
          coverAlt: alt,
        }
      })
      if (!cancelled) {
        setProjects(mapped || [])
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [limit])

  return { projects, loading }
}