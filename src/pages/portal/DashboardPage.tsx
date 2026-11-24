import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowRight, MapPin, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { DashboardSkeleton } from '../../components/ui/Skeleton'
import { AppCard } from '../../components/ui/AppCard'
import { buttonAccentClassName } from '../../components/ui/inputStyles'
import { formatRelative } from '../../lib/format'

type Project = {
  id: string
  title: string
  status: string
  completion_percentage: number
  location: string | null
  updated_at?: string
}

export function DashboardPage() {
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const enquirySent = Boolean((location.state as { enquirySent?: boolean } | null)?.enquirySent)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there')

      const { data } = await supabase
        .from('projects')
        .select('id, title, status, completion_percentage, location, updated_at')
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <DashboardSkeleton />

  const activeCount = projects.filter((p) => p.status === 'active').length

  return (
    <div>
      <PageHeader
        eyebrow="Client portal"
        title={`Welcome back, ${name}`}
        description="Track progress, view BOQs, message your project team, and upload project files."
        actions={
          <Link to="/portal/enquiry" className={buttonAccentClassName}>
            <Upload className="mr-2 h-4 w-4" />
            Start new enquiry / Upload plans
          </Link>
        }
      />

      {enquirySent && (
        <p className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          Your enquiry was submitted. Our team will review your plans and create your project here in the portal.
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AppCard className="bg-gradient-to-br from-primary/10 to-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your projects</p>
          <p className="mt-2 text-3xl font-bold">{projects.length}</p>
        </AppCard>
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active builds</p>
          <p className="mt-2 text-3xl font-bold">{activeCount}</p>
        </AppCard>
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New build?</p>
          <Link to="/portal/enquiry" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            Upload plans & enquire →
          </Link>
        </AppCard>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Submit an enquiry with your drawings and our team will set up your project. Once created, progress, BOQs, and messages appear here."
          action={
            <Link to="/portal/enquiry" className={buttonAccentClassName}>
              Start new enquiry / Upload plans
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/portal/projects/${p.id}`}
              className="group block rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold leading-snug group-hover:text-primary">{p.title}</h2>
                  {p.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.location}
                    </p>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Overall progress</span>
                  <span>{p.completion_percentage}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${Math.min(100, p.completion_percentage ?? 0)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Updated {p.updated_at ? formatRelative(p.updated_at) : 'recently'}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  Open project
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}