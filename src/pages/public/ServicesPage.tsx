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

export function ServicesPage() {
  return (
    <div>
      <section className="page-hero border-b border-border/60">
        <div className="container mx-auto px-4">
          <p className="section-eyebrow">Services</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Integrated construction services</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            End-to-end expertise across every stage of the build.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div key={s.num} className="rounded-xl border bg-background p-6 transition-colors hover:border-primary">
              <div className="text-sm font-medium text-muted-foreground">{s.num}</div>
              <h2 className="mt-3 text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}