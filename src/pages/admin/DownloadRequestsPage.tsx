import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatDateTime } from '../../lib/format'
import { buttonAccentClassName } from '../../components/ui/inputStyles'

export function DownloadRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('boq_download_requests')
      .select(`
        *,
        profiles!requested_by (full_name, email),
        boq_documents (title, project_id)
      `)
      .order('requested_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('boq_download_requests')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq('id', id)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Approvals"
        title="BOQ download requests"
        description="Approve or decline client requests to export BOQ spreadsheets."
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : requests.length === 0 ? (
        <EmptyState title="No requests" description="Client download requests will show up here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <AppCard key={r.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{r.boq_documents?.title || 'BOQ'}</h2>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.profiles?.full_name || r.profiles?.email || 'Client'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.requested_at)}</p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(r.id, 'approved')}
                      className={buttonAccentClassName}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(r.id, 'rejected')}
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/15"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  )
}