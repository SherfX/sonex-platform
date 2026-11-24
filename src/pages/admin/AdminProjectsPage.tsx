import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Manage BOQs, progress updates, and client conversations."
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects" description="Create projects in Supabase or seed data to get started." />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <AppCard key={p.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{p.title}</h2>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.location || 'No location'} · {p.completion_percentage}% complete
                  </p>
                  <div className="mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.completion_percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/projects/${p.id}/boq`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    BOQ editor
                  </Link>
                  <Link
                    to={`/admin/projects/${p.id}/progress`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    Progress & photos
                  </Link>
                  <Link
                    to={`/portal/projects/${p.id}`}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                  >
                    Client view
                  </Link>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  )
}