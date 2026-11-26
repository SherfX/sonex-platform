import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type SectionBackdropProps = {
  children: ReactNode
  imageUrl?: string | null
  variant?: 'hero' | 'cta' | 'light'
  className?: string
}

const GRADIENTS = {
  hero: 'bg-gradient-to-b from-primary via-[#0f1c35] to-primary',
  cta: 'bg-gradient-to-br from-primary via-primary to-[#0c1528]',
  light: 'bg-muted/30',
}

const HERO_FALLBACK = '/hero-reference-fallback.jpg'

export function SectionBackdrop({
  children,
  imageUrl,
  variant = 'hero',
  className,
}: SectionBackdropProps) {
  const isDark = variant === 'hero' || variant === 'cta'
  const resolvedImage =
    imageUrl || (variant === 'hero' || variant === 'cta' ? HERO_FALLBACK : null)

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border/40',
        !resolvedImage && GRADIENTS[variant],
        isDark && resolvedImage && 'text-primary-foreground',
        isDark && !resolvedImage && 'text-primary-foreground',
        className,
      )}
    >
      {resolvedImage && (
        <>
          <img
            src={resolvedImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={variant === 'hero' ? 'eager' : 'lazy'}
          />
          <div
            className={cn(
              'absolute inset-0',
              variant === 'hero' && 'bg-gradient-to-b from-primary/88 via-primary/78 to-primary/92',
              variant === 'cta' && 'bg-gradient-to-r from-primary/90 via-primary/82 to-primary/88',
              variant === 'light' && 'bg-background/88',
            )}
          />
          {isDark && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,oklch(0.62_0.16_42_/_0.2),transparent_45%)]" />
            </>
          )}
        </>
      )}
      {!resolvedImage && variant === 'hero' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,oklch(0.62_0.16_42_/_0.25),transparent_42%)]" />
      )}
      <div className="relative">{children}</div>
    </section>
  )
}