import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function AppCard({
  children,
  className,
  padding = true,
}: {
  children: ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card shadow-sm',
        padding && 'p-5 md:p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}