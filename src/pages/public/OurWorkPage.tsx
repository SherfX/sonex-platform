import { Link } from 'react-router'
import { useShowcaseProjects } from '../../hooks/useShowcaseProjects'
import { useSiteBackgrounds } from '../../hooks/useSiteBackgrounds'
import { SectionBackdrop } from '../../components/public/SectionBackdrop'
import { ProjectShowcaseCard } from '../../components/public/ProjectShowcaseCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'

export function OurWorkPage() {
  const { projects, loading } = useShowcaseProjects()
  const { urls } = useSiteBackgrounds()

  return (
    <div>
      <SectionBackdrop imageUrl={urls.hero_background} variant="hero" className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
            Portfolio
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Our work</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/85">
            A selection of builds delivered with the same rigour we bring to every Sonex engagement.
          </p>
        </div>
      </SectionBackdrop>

      <section className="container mx-auto px-4 py-16 md:py-20">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ListSkeleton rows={6} />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="Showcase coming soon"
            description="When projects are marked public or completed, they will appear here."
            action={
              <Link to="/contact" className="text-sm font-semibold text-primary hover:underline">
                Discuss your project
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectShowcaseCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <div className="mt-16 rounded-xl border border-border/60 bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-semibold">Planning your own build?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your brief and our team will follow up with next steps.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
          >
            Start a project
          </Link>
        </div>
      </section>
    </div>
  )
}