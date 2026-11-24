import { Outlet, Link, NavLink, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

export function PortalLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-1.5 text-sm font-medium transition',
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 via-background to-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                S
              </span>
              Client portal
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/portal" end className={linkClass}>
                Projects
              </NavLink>
              <Link
                to="/"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Website
              </Link>
            </nav>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}