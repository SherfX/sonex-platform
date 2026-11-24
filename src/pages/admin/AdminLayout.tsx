import { Outlet, Link, NavLink, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/enquiries', label: 'Enquiries' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/download-requests', label: 'Downloads' },
  { to: '/admin/chats', label: 'Chats' },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/showcase', label: 'Showcase' },
]

export function AdminLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                A
              </span>
              Sonex Admin
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <Link to="/portal" className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">
                Portal
              </Link>
              <Link to="/" className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">
                Website
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
              >
                Log out
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}