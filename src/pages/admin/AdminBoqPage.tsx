import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AppCard } from '../../components/ui/AppCard'
import { PageLoader } from '../../components/ui/PageLoader'
import { buttonPrimaryClassName, inputClassName } from '../../components/ui/inputStyles'
import { markBoqSharedForProject } from '../../lib/enquiries'

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

export function AdminBoqPage() {
  const { id } = useParams()
  const [sections, setSections] = useState<Section[]>([])
  const [boq, setBoq] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) return
    loadBoq()
  }, [id])

  async function loadBoq() {
    const { data: boqData } = await supabase
      .from('boq_documents')
      .select('*')
      .eq('project_id', id)
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
    setLoading(false)
  }

  async function updateItem(itemId: string, field: 'quantity' | 'rate', value: number) {
    setSaving(true)
    await supabase.from('boq_items').update({ [field]: value }).eq('id', itemId)
    await loadBoq()
    setSaving(false)
  }

  async function createBoq() {
    if (!id) return
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: project } = await supabase.from('projects').select('title').eq('id', id).single()
    const { data: doc, error } = await supabase
      .from('boq_documents')
      .insert({
        project_id: id,
        title: project?.title ? `BOQ — ${project.title}` : 'Bill of quantities',
        status: 'draft',
        is_client_visible: false,
        created_by: user?.id,
      })
      .select('id')
      .single()
    if (!error && doc) {
      const { data: section } = await supabase
        .from('boq_sections')
        .insert({ boq_document_id: doc.id, title: 'Section 1', sort_order: 1 })
        .select('id')
        .single()
      if (section) {
        await supabase.from('boq_items').insert({
          section_id: section.id,
          description: 'Add line item description',
          unit: 'Item',
          quantity: 1,
          rate: 0,
          sort_order: 1,
        })
      }
    }
    await loadBoq()
    setSaving(false)
  }

  async function toggleClientVisibility() {
    if (!boq || !id) return
    setSharing(true)
    const next = !boq.is_client_visible
    await supabase
      .from('boq_documents')
      .update({
        is_client_visible: next,
        status: next ? 'approved' : 'draft',
      })
      .eq('id', boq.id)
    if (next) await markBoqSharedForProject(id)
    await loadBoq()
    setSharing(false)
  }

  if (loading) return <PageLoader label="Loading BOQ editor…" />
  if (!boq) {
    return (
      <AppCard>
        <p className="font-medium">No BOQ for this project yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a bill of quantities, edit it here, then share with the client when ready.
        </p>
        <button type="button" onClick={createBoq} disabled={saving} className={`mt-4 ${buttonPrimaryClassName}`}>
          {saving ? 'Creating…' : 'Create BOQ'}
        </button>
        <Link to="/admin/projects" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to projects
        </Link>
      </AppCard>
    )
  }

  const grandTotal = sections.reduce(
    (sum, section) => sum + section.items.reduce((s, i) => s + Number(i.amount || 0), 0),
    0,
  )

  return (
    <div>
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All projects
      </Link>

      <PageHeader
        eyebrow="BOQ editor"
        title={boq.title}
        description={`${boq.currency} · ${saving ? 'Saving changes…' : 'Edit quantities and rates inline'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={boq.status} />
            <button
              type="button"
              disabled={sharing}
              onClick={toggleClientVisibility}
              className={
                boq.is_client_visible
                  ? 'rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted'
                  : buttonPrimaryClassName
              }
            >
              {sharing
                ? 'Updating…'
                : boq.is_client_visible
                  ? 'Visible to client — click to hide'
                  : 'Share BOQ with client'}
            </button>
          </div>
        }
      />

      {boq.is_client_visible && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          Clients with access to this project can view the BOQ and request a download. Linked enquiry status is set to
          BOQ shared.
        </p>
      )}

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionTotal = section.items.reduce((s, i) => s + Number(i.amount || 0), 0)
          return (
            <AppCard key={section.id} className="overflow-hidden p-0">
              <div className="border-b border-border/60 bg-muted/30 px-5 py-3 font-semibold">
                {section.title}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-2.5">Description</th>
                      <th className="px-3 py-2.5">Unit</th>
                      <th className="px-3 py-2.5 text-right">Qty</th>
                      <th className="px-3 py-2.5 text-right">Rate</th>
                      <th className="px-5 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                        <td className="px-5 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            defaultValue={item.quantity}
                            onBlur={(e) =>
                              updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className={cnInput('w-24 text-right')}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={item.rate}
                            onBlur={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            className={cnInput('w-28 text-right')}
                          />
                        </td>
                        <td className="px-5 py-2 text-right font-medium tabular-nums">
                          {Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-primary/5">
                      <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold">
                        Section total
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">
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
        <AppCard className="min-w-[14rem] bg-gradient-to-br from-accent/10 to-card text-right">
          <p className="text-sm text-muted-foreground">Grand total</p>
          <p className="text-3xl font-bold tabular-nums">{grandTotal.toFixed(2)}</p>
        </AppCard>
      </div>
    </div>
  )
}

function cnInput(extra: string) {
  return `${inputClassName} ${extra}`
}