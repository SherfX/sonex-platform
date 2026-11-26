import { Link } from 'react-router'
import { useShowcasePosts } from '../../hooks/useShowcasePosts'
import { useSiteBackgrounds } from '../../hooks/useSiteBackgrounds'
import { SectionBackdrop } from '../../components/public/SectionBackdrop'
import { ShowcasePostCard } from '../../components/public/ShowcasePostCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { buttonCtaClassName } from '../../components/ui/inputStyles'

export function OurWorkPage() {
  const { posts, loading } = useShowcasePosts()
  const { urls } = useSiteBackgrounds()

  return (
    <div>
      <SectionBackdrop imageUrl={urls.hero_background} variant="hero" className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/75">
            Portfolio
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl lg:text-[3.25rem]">Our work</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/88">
            Completed builds and highlights from the Sonex team — each project delivered with precision and care.
          </p>
        </div>
      </SectionBackdrop>

      <section className="container mx-auto px-4 py-16 md:py-24">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <ListSkeleton rows={6} />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Showcase coming soon"
            description="New posts will appear here as the team publishes them from Admin → Showcase."
            action={
              <Link to="/contact" className="text-sm font-semibold text-primary hover:underline">
                Discuss your project
              </Link>
            }
          />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <ShowcasePostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="mt-20 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-10 text-center shadow-lg">
          <h2 className="text-2xl font-bold tracking-tight">Planning your own build?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Share your brief and our team will follow up with clear next steps.
          </p>
          <Link to="/contact" className={`${buttonCtaClassName} mt-8`}>
            Start a project
          </Link>
        </div>
      </section>
    </div>
  )
}