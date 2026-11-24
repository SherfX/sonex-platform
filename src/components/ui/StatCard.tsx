import { Link } from 'react-router'
import { cn } from '../../lib/utils'

export function StatCard({
  label,
  value,
  hint,
  to,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  to?: string
  accent?: boolean
}) {
  const inner = (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:shadow-md',
        accent && 'border-accent/30 bg-gradient-to-br from-accent/5 to-card',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {inner}
      </Link>
    )
  }
  return inner
}