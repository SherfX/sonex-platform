import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatDateTime } from '../../lib/format'

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('project_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEnquiries(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Enquiries"
        description="Project submissions from the public contact form."
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : enquiries.length === 0 ? (
        <EmptyState title="No enquiries yet" description="New submissions will appear here." />
      ) : (
    <div className="space-y-3">
      {enquiries.map((e) => (
        <AppCard key={e.id} className="p-0 overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{e.full_name}</h2>
                <StatusBadge status={e.status || 'new'} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {e.email}
                {e.phone ? ` · ${e.phone}` : ''}
                {e.company ? ` · ${e.company}` : ''}
              </p>
              <p className="mt-3 text-sm leading-relaxed">{e.message}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
          </div>
        </AppCard>
      ))}
    </div>
      )}
    </div>
  )
}