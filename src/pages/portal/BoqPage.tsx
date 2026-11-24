import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageLoader } from '../../components/ui/PageLoader'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { buttonAccentClassName, buttonPrimaryClassName } from '../../components/ui/inputStyles'

type Item = {
  id: string
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
}

type Section = {
  id: string
  title: string
  items: Item[]
}

export function BoqPage() {
  const { id } = useParams()
  const [sections, setSections] = useState<Section[]>([])
  const [boq, setBoq] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUserId(user?.id || null)

    const { data: boqData } = await supabase
      .from('boq_documents')
      .select('*')
      .eq('project_id', id)
      .eq('is_client_visible', true)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!boqData) {
      setLoading(false)
      return
    }
    setBoq(boqData)

    const { data: sectionsData } = await supabase
      .from('boq_sections')
      .select(`id, title, sort_order, boq_items (id, description, unit, quantity, rate, amount, sort_order)`)
      .eq('boq_document_id', boqData.id)
      .order('sort_order')

    const formatted = (sectionsData || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      items: (s.boq_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))
    setSections(formatted)

    if (user) {
      const { data: req } = await supabase
        .from('boq_download_requests')
        .select('*')
        .eq('boq_document_id', boqData.id)
        .eq('requested_by', user.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setRequest(req)
    }

    setLoading(false)
  }

  async function requestDownload() {
    if (!boq || !userId) return
    await supabase.from('boq_download_requests').insert({
      boq_document_id: boq.id,
      requested_by: userId,
      status: 'pending',
    })
    load()
  }

  async function exportExcel() {
    setExporting(true)
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('BOQ')
    sheet.columns = [
      { header: 'Section', key: 'section', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Unit', key: 'unit', width: 12 },
      { header: 'Qty', key: 'quantity', width: 12 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'amount', width: 14 },
    ]
    sections.forEach((section) => {
      section.items.forEach((item) => {
        sheet.addRow({
          section: section.title,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })
      })
    })
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${boq?.title || 'BOQ'}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  if (loading) return <PageLoader label="Loading BOQ…" />

  if (!boq) {
    return (
      <div>
        <Link
          to={`/portal/projects/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to project
        </Link>
        <EmptyState
          className="mt-8"
          title="BOQ not available yet"
          description="Your bill of quantities will appear here once Sonex publishes an approved version."
        />
      </div>
    )
  }

  const grandTotal = sections.reduce(
    (sum, section) => sum + section.items.reduce((s, i) => s + Number(i.amount || 0), 0),
    0,
  )

  return (
    <div>
      <Link
        to={`/portal/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to project
      </Link>

      <PageHeader
        eyebrow="Bill of quantities"
        title={boq.title}
        description={`Currency: ${boq.currency}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={boq.status} />
            {!request && (
              <button type="button" onClick={requestDownload} className={buttonPrimaryClassName}>
                Request Excel download
              </button>
            )}
            {request?.status === 'pending' && (
              <span className="text-sm text-muted-foreground">Download pending approval</span>
            )}
            {request?.status === 'approved' && (
              <button
                type="button"
                disabled={exporting}
                onClick={exportExcel}
                className={buttonAccentClassName}
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Preparing…' : 'Download Excel'}
              </button>
            )}
            {request?.status === 'rejected' && (
              <span className="text-sm text-destructive">Download request declined</span>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionTotal = section.items.reduce((s, i) => s + Number(i.amount || 0), 0)
          return (
            <AppCard key={section.id} className="overflow-hidden p-0">
              <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
                <h2 className="font-semibold">{section.title}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Description</th>
                      <th className="px-3 py-3 font-semibold">Unit</th>
                      <th className="px-3 py-3 text-right font-semibold">Qty</th>
                      <th className="px-3 py-3 text-right font-semibold">Rate</th>
                      <th className="px-5 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}
                      >
                        <td className="px-5 py-2.5">{item.description}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{item.unit}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {Number(item.rate).toFixed(2)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium tabular-nums">
                          {Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/60 bg-primary/5">
                      <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold">
                        Section total
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold tabular-nums">
                        {sectionTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </AppCard>
          )
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <AppCard className="min-w-[14rem] bg-gradient-to-br from-primary/10 to-card text-right">
          <p className="text-sm text-muted-foreground">Grand total ({boq.currency})</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{grandTotal.toFixed(2)}</p>
        </AppCard>
      </div>
    </div>
  )
}