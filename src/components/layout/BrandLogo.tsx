import { Link } from 'react-router'
import { cn } from '../../lib/utils'

type BrandLogoProps = {
  /** Light text on dark hero overlay */
  onDark?: boolean
  className?: string
}

export function BrandLogo({ onDark = false, className }: BrandLogoProps) {
  return (
    <Link to="/" className={cn('group flex shrink-0 items-center gap-3', className)}>
      <img
        src="/sonex-logo.jpg"
        alt="Sonex Contractors"
        className="h-11 w-11 rounded-full object-cover shadow-md ring-2 ring-white/20 transition group-hover:shadow-lg"
      />
      <div className="leading-tight">
        <div
          className={cn(
            'text-[15px] font-semibold tracking-tight sm:text-base',
            onDark ? 'text-white' : 'text-foreground',
          )}
        >
          Sonex Contractors
        </div>
        <div
          className={cn(
            'hidden text-[10px] font-semibold uppercase tracking-[0.2em] sm:block',
            onDark ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          Built to endure
        </div>
      </div>
    </Link>
  )
}