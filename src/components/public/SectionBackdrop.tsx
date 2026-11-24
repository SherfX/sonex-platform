import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type SectionBackdropProps = {
  children: ReactNode
  imageUrl?: string | null
  variant?: 'hero' | 'cta' | 'light'
  className?: string
}

const GRADIENTS = {
  hero: 'bg-gradient-to-b from-primary via-primary to-primary/95',
  cta: 'bg-gradient-to-br from-primary via-primary/95 to-primary/85',
  light: 'bg-muted/40',
}

export function SectionBackdrop({
  children,
  imageUrl,
  variant = 'hero',
  className,
}: SectionBackdropProps) {
  const isDark = variant === 'hero' || variant === 'cta'

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border/60',
        !imageUrl && GRADIENTS[variant],
        isDark && !imageUrl && 'text-primary-foreground',
        className,
      )}
    >
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={variant === 'hero' ? 'eager' : 'lazy'}
          />
          <div
            className={cn(
              'absolute inset-0',
              variant === 'hero' && 'bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95',
              variant === 'cta' && 'bg-gradient-to-r from-primary/92 via-primary/85 to-primary/75',
              variant === 'light' && 'bg-background/85',
            )}
          />
          {!isDark && variant === 'light' && null}
          {isDark && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.62_0.16_42_/_0.18),transparent_45%)]" />
          )}
        </>
      )}
      {!imageUrl && variant === 'hero' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.62_0.16_42_/_0.22),transparent_45%)]" />
      )}
      <div className="relative">{children}</div>
    </section>
  )
}