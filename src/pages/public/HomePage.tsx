import { Link } from 'react-router'
import { useSiteBackgrounds } from '../../hooks/useSiteBackgrounds'
import { useShowcasePosts } from '../../hooks/useShowcasePosts'
import { SectionBackdrop } from '../../components/public/SectionBackdrop'
import { ShowcasePostCard } from '../../components/public/ShowcasePostCard'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { buttonCtaClassName } from '../../components/ui/inputStyles'

const services = [
  { num: '01', title: 'Residential Construction', desc: 'Homes, apartments and housing developments delivered to specification, on schedule.' },
  { num: '02', title: 'Commercial Construction', desc: 'Retail, hotel and office builds engineered for durability and daily performance.' },
  { num: '03', title: 'Industrial Construction', desc: 'Plants, warehousing and specialised facilities built to demanding technical standards.' },
  { num: '04', title: 'Infrastructure Development', desc: 'Civil works, roads and utilities that carry communities and commerce.' },
  { num: '05', title: 'Renovation & Remodeling', desc: 'Refurbishment and adaptive reuse that extends the life and value of a building.' },
  { num: '06', title: 'Design & Build', desc: 'Single-contract delivery from concept design through to handover.' },
  { num: '07', title: 'Quantity Surveying', desc: 'Cost planning, measurement and commercial control across the project lifecycle.' },
  { num: '08', title: 'Aluminium Glazing', desc: 'Facades, curtain walling and glazing systems installed to precise tolerances.' },
]

const values = [
  { title: 'Integrity', desc: 'Honesty and accountability in all dealings.' },
  { title: 'Excellence', desc: 'Uncompromised quality and craftsmanship.' },
  { title: 'Innovation', desc: 'Leveraging modern tools like BIM & 3D modeling.' },
  { title: 'Commitment', desc: 'On-time delivery with cost efficiency.' },
  { title: 'Safety', desc: 'Ensuring zero accidents with strict compliance standards.' },
]

const whyUs = [
  { title: 'Proven Experience', desc: '40+ successful projects delivered.' },
  { title: 'Professional Team', desc: 'Skilled engineers, architects and project managers.' },
  { title: 'Compliance & Safety', desc: 'Meeting global standards and local regulations.' },
  { title: 'Client-Centric Approach', desc: 'Customised solutions for unique requirements.' },
  { title: 'Sustainability', desc: 'Commitment to reducing environmental impact.' },
]

export function HomePage() {
  const { urls } = useSiteBackgrounds()
  const { posts: featuredPosts, loading: showcaseLoading } = useShowcasePosts(3)

  return (
    <div>
      <SectionBackdrop imageUrl={urls.hero_background} variant="hero" className="py-24 md:py-32 lg:py-36">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-foreground/72">
            Sonex Contractors
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:text-[4rem]">
            Crafting durable solutions
            <br />
            <span className="text-primary-foreground/95">for modern living</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-primary-foreground/88 md:text-xl md:leading-relaxed">
            With a strong foundation of expertise and innovation, we shape modern living — from planning and design
            through to project execution.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/contact" className={buttonCtaClassName}>
              Start a project
            </Link>
            <Link
              to="/work"
              className="inline-flex min-w-[10rem] items-center justify-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-8 py-3 text-sm font-semibold tracking-wide text-primary-foreground backdrop-blur-md transition hover:border-primary-foreground/45 hover:bg-primary-foreground/15"
            >
              Our work
            </Link>
          </div>
        </div>
      </SectionBackdrop>

      <section className="border-b border-border/40 bg-background py-16 md:py-20">
        <div className="container mx-auto grid grid-cols-2 gap-10 px-4 text-center md:grid-cols-4">
          {[
            { value: '40+', label: 'Projects delivered' },
            { value: '8', label: 'Service lines' },
            { value: '5', label: 'Board directors' },
            { value: '2025', label: 'Founded' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold tracking-tight text-primary md:text-4xl">{s.value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">Featured work</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">From the showcase</h2>
            </div>
            <Link to="/work" className="text-sm font-semibold text-primary hover:underline">
              View all work →
            </Link>
          </div>
          {showcaseLoading ? (
            <ListSkeleton rows={3} />
          ) : featuredPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Showcase posts appear when published from Admin → Showcase.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <ShowcasePostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SectionBackdrop
        imageUrl={urls.services_background}
        variant="light"
        className="relative border-y border-border/40 py-20 md:py-28"
      >
        <div className="container relative mx-auto px-4">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">Our services</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Integrated construction services, end to end
              </h2>
            </div>
            <Link to="/services" className="text-sm font-semibold text-primary hover:underline">
              All services →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.num}
                className="group rounded-2xl border border-border/50 bg-card/95 p-6 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
              >
                <div className="text-xs font-bold text-accent">{s.num}</div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionBackdrop>

      <section className="border-y border-border/40 bg-muted/25 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <p className="section-eyebrow">Core values</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">What guides every project</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <p className="section-eyebrow">Why Sonex</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Why clients trust us</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {whyUs.map((w) => (
              <div key={w.title}>
                <h3 className="font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionBackdrop imageUrl={urls.cta_background} variant="cta" className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to start your project?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/88">
            Tell us about your plans. We&apos;ll review and get back to you with the next steps.
          </p>
          <Link to="/contact" className={`${buttonCtaClassName} mt-10`}>
            Start a project
          </Link>
        </div>
      </SectionBackdrop>
    </div>
  )
}