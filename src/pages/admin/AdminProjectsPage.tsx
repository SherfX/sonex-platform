import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'

type ProjectRow = {
  id: string
  title: string
  status: string
  location: string | null
  completion_percentage: number
  enquiryStatus?: string | null
}

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: projectRows }, { data: submissions }] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, status, location, completion_percentage')
          .order('created_at', { ascending: false }),
        supabase.from('project_submissions').select('project_id, status').not('project_id', 'is', null),
      ])

      const enquiryByProject = new Map(
        (submissions || []).map((s) => [s.project_id as string, s.status as string]),
      )

      setProjects(
        (projectRows || []).map((p) => ({
          ...p,
          enquiryStatus: enquiryByProject.get(p.id) ?? null,
        })),
      )
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Create or edit BOQs, share with clients, and track site progress."
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects"
          description="Convert an enquiry from the Enquiries inbox to create a client-linked project."
          action={
            <Link to="/admin/enquiries" className="text-sm font-semibold text-primary hover:underline">
              Go to enquiries →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <AppCard key={p.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{p.title}</h2>
                    <StatusBadge status={p.status} />
                    {p.enquiryStatus && <StatusBadge status={p.enquiryStatus} className="opacity-90" />}
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