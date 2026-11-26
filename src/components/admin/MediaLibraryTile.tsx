import { Trash2 } from 'lucide-react'
import { getStoragePublicUrl, type MediaAsset } from '../../lib/media'
import { cn } from '../../lib/utils'

type MediaLibraryTileProps = {
  asset: MediaAsset
  selected?: boolean
  deleting?: boolean
  onSelect?: () => void
  onDelete: (asset: MediaAsset) => void
  aspect?: 'video' | 'square'
}

export function MediaLibraryTile({
  asset,
  selected,
  deleting,
  onSelect,
  onDelete,
  aspect = 'video',
}: MediaLibraryTileProps) {
  const url = getStoragePublicUrl(asset.bucket, asset.path)

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20">
      <button
        type="button"
        disabled={deleting}
        onClick={onSelect}
        className={cn(
          'block w-full text-left transition',
          selected && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
          onSelect ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <img
          src={url}
          alt={asset.alt_text || asset.filename}
          className={cn('w-full object-cover', aspect === 'square' ? 'aspect-square' : 'aspect-video')}
        />
        <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">{asset.filename}</p>
      </button>
      <button
        type="button"
        disabled={deleting}
        title="Delete image"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(asset)
        }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 text-destructive shadow-md opacity-0 transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        aria-label={`Delete ${asset.filename}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}