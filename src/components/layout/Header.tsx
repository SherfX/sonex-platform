import { Link, NavLink, useLocation } from 'react-router'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSocialLinks } from '../../hooks/useSocialLinks'
import { SocialLinks } from './SocialLinks'
import { cn } from '../../lib/utils'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/work', label: 'Our work' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { links: socialLinks } = useSocialLinks()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      setUser(data.user ? { id: data.user.id } : null)
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        if (mounted) setRole(profile?.role ?? null)
      } else {
        setRole(null)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null)
      if (!session?.user) setRole(null)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const isStaff = role === 'admin' || role === 'super_admin' || role === 'staff'

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:h-[4.25rem]">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            S
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              Sonex Contractors
            </div>
            <div className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
              Built to endure
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <SocialLinks links={socialLinks} variant="header" className="mr-1 hidden xl:flex" />
          {user ? (
            <>
              <Link
                to="/portal"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Portal
              </Link>
              {isStaff && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Login
            </Link>
          )}
          <Link
            to="/contact"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90"
          >
            Start a project
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to="/portal" className="text-sm font-medium">
                  Client portal
                </Link>
                {isStaff && (
                  <Link to="/admin" className="text-sm font-medium">
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium">
                Login / Register
              </Link>
            )}
            <SocialLinks links={socialLinks} variant="footer" className="pt-2" />
            <Link
              to="/contact"
              className="mt-2 rounded-md bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-foreground"
            >
              Start a project
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}