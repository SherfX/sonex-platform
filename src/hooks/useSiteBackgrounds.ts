import { useQuery } from '@tanstack/react-query'
import { resolveBackgroundUrlsBySlot, type BackgroundSlotKey } from '../lib/media'

export function useSiteBackgrounds() {
  const query = useQuery({
    queryKey: ['site-backgrounds'],
    queryFn: resolveBackgroundUrlsBySlot,
    staleTime: 60_000,
  })

  const urls = query.data ?? {
    hero_background: null,
    cta_background: null,
    services_background: null,
  } satisfies Record<BackgroundSlotKey, string | null>

  return { urls, loading: query.isLoading, refetch: query.refetch }
}