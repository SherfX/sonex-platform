import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PLACEHOLDER_SOCIAL_LINKS, type SocialLink } from '../lib/social'

async function fetchSocialLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('social_links')
    .select('id, platform, url, label, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !data?.length) return PLACEHOLDER_SOCIAL_LINKS
  return data as SocialLink[]
}

export function useSocialLinks() {
  const query = useQuery({
    queryKey: ['social_links'],
    queryFn: fetchSocialLinks,
    staleTime: 30_000,
  })

  return {
    links: query.data ?? PLACEHOLDER_SOCIAL_LINKS,
    loading: query.isLoading,
    refetch: query.refetch,
  }
}