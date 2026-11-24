import { cn } from '../../lib/utils'

const STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  new: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-300',
  under_review: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  expired: 'bg-muted text-muted-foreground',
  project_created: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  boq_shared: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  reviewing: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
}

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  if (!status) return null
  const key = status.toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        STYLES[key] ?? 'bg-secondary text-secondary-foreground',
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}