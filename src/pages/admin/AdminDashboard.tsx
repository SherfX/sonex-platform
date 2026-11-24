import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { AppCard } from '../../components/ui/AppCard'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { formatRelative, formatDateTime } from '../../lib/format'
import { StatusBadge } from '../../components/ui/StatusBadge'

type ActivityItem = {
  id: string
  type: 'enquiry' | 'download' | 'chat'
  title: string
  subtitle?: string
  at: string
  href: string
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    openEnquiries: 0,
    activeProjects: 0,
    pendingDownloads: 0,
    publicChats: 0,
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [enquiries, projects, downloads, chats] = await Promise.all([
      supabase.from('project_submissions').select('id, status').eq('status', 'new'),
      supabase.from('projects').select('id, status').eq('status', 'active'),
      supabase.from('boq_download_requests').select('id').eq('status', 'pending'),
      supabase.from('conversations').select('id').is('project_id', null),
    ])

    setStats({
      openEnquiries: enquiries.data?.length ?? 0,
      activeProjects: projects.data?.length ?? 0,
      pendingDownloads: downloads.data?.length ?? 0,
      publicChats: chats.data?.length ?? 0,
    })

    const [recentEnquiries, recentDownloads, recentChats] = await Promise.all([
      supabase
        .from('project_submissions')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('boq_download_requests')
        .select('id, status, requested_at, boq_documents(title)')
        .order('requested_at', { ascending: false })
        .limit(5),
      supabase
        .from('conversations')
        .select('id, title, created_at')
        .is('project_id', null)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const items: ActivityItem[] = []
    ;(recentEnquiries.data || []).forEach((e) => {
      items.push({
        id: `e-${e.id}`,
        type: 'enquiry',
        title: e.full_name || 'New enquiry',
        at: e.created_at,
        href: '/admin/enquiries',
      })
    })
    ;(recentDownloads.data || []).forEach((d: any) => {
      items.push({
        id: `d-${d.id}`,
        type: 'download',
        title: d.boq_documents?.title || 'BOQ download',
        subtitle: d.status,
        at: d.requested_at,
        href: '/admin/download-requests',
      })
    })
    ;(recentChats.data || []).forEach((c) => {
      items.push({
        id: `c-${c.id}`,
        type: 'chat',
        title: c.title || 'Public chat',
        at: c.created_at,
        href: '/admin/chats',
      })
    })

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    setActivity(items.slice(0, 8))
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="Overview of enquiries, projects, download approvals, and public chat."
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="New enquiries" value={stats.openEnquiries} to="/admin/enquiries" accent />
            <StatCard label="Active projects" value={stats.activeProjects} to="/admin/projects" />
            <StatCard label="Pending BOQ downloads" value={stats.pendingDownloads} to="/admin/download-requests" />
            <StatCard label="Public chats" value={stats.publicChats} to="/admin/chats" />
          </div>

          <AppCard className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent activity</h2>
              <Link to="/admin/enquiries" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/60">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-muted/30 -mx-2 px-2 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.type}
                          {item.subtitle && (
                            <>
                              {' '}
                              · <StatusBadge status={item.subtitle} className="ml-1 align-middle" />
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatRelative(item.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AppCard>

          <AppCard className="mt-6">
            <h2 className="text-base font-semibold">Quick links</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { to: '/admin/projects', label: 'Manage projects' },
                { to: '/admin/content', label: 'Edit site content' },
                { to: '/admin/chats', label: 'Answer public chats' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-primary/40 hover:bg-primary/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Last refreshed {formatDateTime(new Date().toISOString())}
            </p>
          </AppCard>
        </>
      )}
    </div>
  )
}