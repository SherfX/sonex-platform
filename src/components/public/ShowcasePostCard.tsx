import { cn } from '../../lib/utils'
import type { ShowcasePost } from '../../hooks/useShowcasePosts'

export function ShowcasePostCard({ post, className }: { post: ShowcasePost; className?: string }) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)]',
        className,
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-primary/10">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.imageAlt || post.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted text-sm font-medium text-muted-foreground">
            Sonex Contractors
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary">
          {post.title}
        </h3>
        {post.description && (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {post.description}
          </p>
        )}
      </div>
    </article>
  )
}