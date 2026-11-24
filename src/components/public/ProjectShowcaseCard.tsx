import { MapPin } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import { cn } from '../../lib/utils'
import type { ShowcaseProject } from '../../hooks/useShowcaseProjects'

export function ProjectShowcaseCard({
  project,
  className,
}: {
  project: ShowcaseProject
  className?: string
}) {
  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-lg',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-accent/10">
        {project.coverUrl ? (
          <img
            src={project.coverUrl}
            alt={project.coverAlt || project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
            Sonex Contractors
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <StatusBadge status={project.status} className="shadow-sm backdrop-blur" />
          {project.status === 'completed' && project.completion_percentage >= 100 && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white">
              Delivered
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug tracking-tight group-hover:text-primary">
          {project.title}
        </h3>
        {project.location && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {project.location}
          </p>
        )}
        {project.description && (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}
        <p className="mt-4 text-xs font-medium text-muted-foreground">
          {project.completion_percentage}% complete
        </p>
      </div>
    </article>
  )
}