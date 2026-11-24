import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PLACEHOLDER_SOCIAL_LINKS, type SocialLink } from '../lib/social'

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>(PLACEHOLDER_SOCIAL_LINKS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('social_links')
        .select('id, platform, url, label, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      if (!cancelled) {
        if (!error && data && data.length > 0) {
          setLinks(data as SocialLink[])
        }
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { links, loading }
}