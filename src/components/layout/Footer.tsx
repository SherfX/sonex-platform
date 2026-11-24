import { Link } from 'react-router'
import { useSocialLinks } from '../../hooks/useSocialLinks'
import { SocialLinks } from './SocialLinks'

export function Footer() {
  const { links } = useSocialLinks()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
                S
              </div>
              <span className="text-lg font-semibold tracking-tight">Sonex Contractors</span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/80">
              Building Zimbabwe&apos;s future with durable, high-quality construction solutions.
              From planning and design through to project execution — founded 2025.
            </p>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
                Connect
              </p>
              <SocialLinks
                links={links}
                variant="footer"
                className="mt-3 [&_a]:border-primary-foreground/20 [&_a]:bg-primary-foreground/10 [&_a]:text-primary-foreground [&_a:hover]:border-accent [&_a:hover]:bg-accent [&_a:hover]:text-accent-foreground"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/85">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About' },
                { to: '/services', label: 'Services' },
                { to: '/work', label: 'Our work' },
                { to: '/contact', label: 'Contact' },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Get started
            </p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
              Tell us about your next build. Our team will review your enquiry and follow up with
              clear next steps.
            </p>
            <Link
              to="/contact"
              className="mt-5 inline-flex rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Start a project
            </Link>
            <p className="mt-6 text-sm text-primary-foreground/70">
              Harare, Zimbabwe ·{' '}
              <Link to="/login" className="underline-offset-4 hover:text-accent hover:underline">
                Client portal login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-primary-foreground/15 pt-8 text-center text-sm text-primary-foreground/65">
          © {year} Sonex Contractors (Pvt) Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  )
}