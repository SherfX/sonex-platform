import { Link, NavLink, useLocation } from 'react-router'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSocialLinks } from '../../hooks/useSocialLinks'
import { SocialLinks } from './SocialLinks'
import { buttonCtaClassName } from '../ui/inputStyles'
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

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors',
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-xl">
      <div className="container mx-auto flex h-[4.5rem] items-center justify-between gap-4 px-4 md:h-20">
        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-md transition group-hover:shadow-lg">
            S
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
              Sonex Contractors
            </div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
              Built to endure
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={cn(navClass, 'relative inline-block pb-0.5')}>
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full bg-accent transition-transform',
                      isActive ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <SocialLinks links={socialLinks} variant="header" className="mr-1 hidden xl:flex" />
          {user ? (
            <>
              <Link to="/portal" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Portal
              </Link>
              {isStaff && (
                <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Login
            </Link>
          )}
          <Link to="/contact" className={cn(buttonCtaClassName, 'hidden px-6 py-2.5 text-xs sm:inline-flex')}>
            Start a project
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden"
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
            <Link to="/contact" className={cn(buttonCtaClassName, 'mt-2 justify-center')}>
              Start a project
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}