export function AboutPage() {
  return (
    <div>
      <section className="page-hero border-b border-border/60">
        <div className="container mx-auto px-4">
          <p className="section-eyebrow">About us</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Building a legacy of success, brick by brick</h1>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl space-y-6 text-lg text-muted-foreground">
          <p>
            Founded in 2025, Sonex Contractors (Private) Limited is built on a foundation of ambition and excellence. Our mission is to lead the construction sector through unwavering dedication and high-quality service, on both a national and international scale.
          </p>
          <p>
            We specialise in complete construction solutions. With a highly skilled team of architects, engineers and project managers, we ensure excellence at every step.
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold">Our core values guide us</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-5">
            {[
              { title: 'Integrity', desc: 'Honesty and accountability in all dealings.' },
              { title: 'Excellence', desc: 'Uncompromised quality and craftsmanship.' },
              { title: 'Innovation', desc: 'Leveraging modern tools like BIM & 3D modeling.' },
              { title: 'Commitment', desc: 'On-time delivery with cost efficiency.' },
              { title: 'Safety', desc: 'Ensuring zero accidents with strict compliance standards.' },
            ].map((v) => (
              <div key={v.title}>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}