import { Link, NavLink, useLocation } from 'react-router'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSocialLinks } from '../../hooks/useSocialLinks'
import { SocialLinks } from './SocialLinks'
import { BrandLogo } from './BrandLogo'
import { buttonCtaClassName } from '../ui/inputStyles'
import { cn } from '../../lib/utils'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/work', label: 'Our work' },
  { to: '/contact', label: 'Contact' },
]

const TRANSPARENT_HEADER_PATHS = new Set(['/', '/work', '/about', '/services', '/contact'])

export function Header() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { links: socialLinks } = useSocialLinks()
  const location = useLocation()

  const canOverlay = TRANSPARENT_HEADER_PATHS.has(location.pathname)
  const overlayMode = canOverlay && !scrolled && !mobileOpen

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      setUser(data.user ? { id: data.user.id } : null)
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
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

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        overlayMode
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-border/40 bg-background/90 shadow-sm backdrop-blur-xl',
      )}
    >
      <div className="container mx-auto flex h-[4.5rem] items-center justify-between gap-4 px-4 md:h-[4.75rem]">
        <BrandLogo onDark={overlayMode} />

        <nav className="hidden items-center gap-8 xl:gap-10 lg:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative inline-block pb-0.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  overlayMode
                    ? isActive
                      ? 'text-sky-300'
                      : 'text-white/85 hover:text-white'
                    : isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full transition-transform',
                      overlayMode ? 'bg-sky-300' : 'bg-accent',
                      isActive ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex lg:gap-4">
          <SocialLinks
            links={socialLinks}
            variant={overlayMode ? 'overlay' : 'header'}
            className="mr-0 hidden xl:flex"
          />
          {user ? (
            <>
              <Link
                to="/portal"
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  overlayMode ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Portal
              </Link>
              {isStaff && (
                <Link
                  to="/admin"
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    overlayMode ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                overlayMode ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Login
            </Link>
          )}
          <Link to="/contact" className={cn(buttonCtaClassName, 'hidden px-6 py-2.5 text-xs sm:inline-flex')}>
            Start a project
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border md:hidden',
            overlayMode ? 'border-white/30 text-white' : 'border-border',
          )}
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
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('text-sm font-semibold uppercase tracking-wide', isActive ? 'text-primary' : 'text-muted-foreground')
                }
              >
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
            <Link to="/contact" className={cn(buttonCtaClassName, 'mt-2 justify-center')}>
              Start a project
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}