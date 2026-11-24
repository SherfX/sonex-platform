import { supabase } from './supabase'

type ProgressMediaRow = {
  id: string
  progress_media?: {
    media_assets?: {
      id: string
      bucket: string
      path: string
      filename: string
      mime_type?: string | null
    } | null
  }[]
}

export async function signedUrlsForReportMedia(
  reports: ProgressMediaRow[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  for (const report of reports) {
    for (const pm of report.progress_media || []) {
      const asset = pm.media_assets
      if (!asset?.path || !asset.mime_type?.startsWith('image/')) continue
      const { data } = await supabase.storage.from(asset.bucket).createSignedUrl(asset.path, expiresIn)
      if (data?.signedUrl) urls[asset.id] = data.signedUrl
    }
  }
  return urls
}