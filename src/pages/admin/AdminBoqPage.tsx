import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AppCard } from '../../components/ui/AppCard'
import { PageLoader } from '../../components/ui/PageLoader'
import { buttonPrimaryClassName, inputClassName } from '../../components/ui/inputStyles'
import { markBoqSharedForProject } from '../../lib/enquiries'
import { createBoqFromTemplate, syncBoqGrandTotal } from '../../lib/boqAdmin'

type Item = {
  id: string
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  sort_order: number
}

type Section = {
  id: string
  title: string
  sort_order: number
  items: Item[]
}

type ClientMeta = {
  full_name: string | null
  email: string | null
  phone: string | null
}

export function AdminBoqPage() {
  const { id: projectId } = useParams()
  const [sections, setSections] = useState<Section[]>([])
  const [boq, setBoq] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [client, setClient] = useState<ClientMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!projectId) return
    loadAll()
  }, [projectId])

  async function loadProject() {
    if (!projectId) return
    const { data } = await supabase
      .from('projects')
      .select('id, title, location, client_id, client:profiles!client_id(full_name, email, phone)')
      .eq('id', projectId)
      .single()
    setProject(data)
    const p = data?.client as ClientMeta | ClientMeta[] | null | undefined
    setClient(Array.isArray(p) ? p[0] : p ?? null)
  }

  async function loadBoq() {
    if (!projectId) return null
    const { data: boqData } = await supabase
      .from('boq_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!boqData) {
      setBoq(null)
      setSections([])
      return null
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
      sort_order: s.sort_order,
      items: (s.boq_items || []).sort((a: Item, b: Item) => a.sort_order - b.sort_order),
    }))
    setSections(formatted)
    return boqData.id
  }

  async function loadAll() {
    setLoading(true)
    await loadProject()
    await loadBoq()
    setLoading(false)
  }

  const grandTotal = useMemo(
    () =>
      sections.reduce(
        (sum, section) => sum + section.items.reduce((s, i) => s + Number(i.amount || 0), 0),
        0,
      ),
    [sections],
  )

  useEffect(() => {
    if (!boq?.id || loading) return
    void syncBoqGrandTotal(boq.id, grandTotal)
  }, [boq?.id, grandTotal, loading])

  async function refreshAfterSave() {
    await loadBoq()
  }

  async function updateItem(
    itemId: string,
    field: 'description' | 'unit' | 'quantity' | 'rate',
    value: string | number,
  ) {
    setSaving(true)
    await supabase.from('boq_items').update({ [field]: value }).eq('id', itemId)
    await loadBoq()
    setSaving(false)
  }

  async function createBoq() {
    if (!projectId) return
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    try {
      await createBoqFromTemplate(projectId, user?.id, project?.title)
      await loadAll()
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  async function addSection() {
    if (!boq) return
    const title = window.prompt('New section title', `Stage ${sections.length + 1}`)
    if (!title?.trim()) return
    setSaving(true)
    const { data: section } = await supabase
      .from('boq_sections')
      .insert({ boq_document_id: boq.id, title: title.trim(), sort_order: sections.length + 1 })
      .select('id')
      .single()
    if (section) {
      await supabase.from('boq_items').insert({
        section_id: section.id,
        description: 'New line item',
        unit: 'Item',
        quantity: 0,
        rate: 0,
        sort_order: 1,
      })
    }
    await refreshAfterSave()
    setSaving(false)
  }

  async function addLineItem(sectionId: string) {
    setSaving(true)
    const section = sections.find((s) => s.id === sectionId)
    const nextSort = (section?.items.length ?? 0) + 1
    await supabase.from('boq_items').insert({
      section_id: sectionId,
      description: 'New line item',
      unit: 'Item',
      quantity: 0,
      rate: 0,
      sort_order: nextSort,
    })
    await refreshAfterSave()
    setSaving(false)
  }

  async function removeItem(itemId: string) {
    if (!window.confirm('Remove this line item?')) return
    setSaving(true)
    await supabase.from('boq_items').delete().eq('id', itemId)
    await refreshAfterSave()
    setSaving(false)
  }

  async function toggleClientVisibility() {
    if (!boq || !projectId) return
    setSharing(true)
    const next = !boq.is_client_visible
    await supabase
      .from('boq_documents')
      .update({
        is_client_visible: next,
        status: next ? 'approved' : 'draft',
        total_amount: grandTotal,
      })
      .eq('id', boq.id)
    if (next) await markBoqSharedForProject(projectId)
    await loadBoq()
    setSharing(false)
  }

  if (loading) return <PageLoader label="Loading BOQ editor…" />

  if (!boq) {
    return (
      <AppCard className="border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card">
        <p className="font-semibold">No BOQ for this project yet</p>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Create a bill of quantities using the standard 8-stage N.Moyo template, then edit lines and share with the
          client.
        </p>
        <button type="button" onClick={createBoq} disabled={saving} className={`mt-5 ${buttonPrimaryClassName}`}>
          {saving ? 'Creating…' : 'Create BOQ from template'}
        </button>
        <Link to="/admin/projects" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to projects
        </Link>
      </AppCard>
    )
  }

  const clientName = client?.full_name || 'Client'
  const clientAddress = project?.location || 'Address on file'

  return (
    <div className="space-y-6">
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
        description={`${boq.currency} · ${saving ? 'Saving…' : 'All fields save on blur'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={boq.status} />
            <button type="button" onClick={addSection} disabled={saving} className={buttonOutline}>
              <Plus className="mr-1 h-4 w-4" />
              Add section
            </button>
            <button
              type="button"
              disabled={sharing}
              onClick={toggleClientVisibility}
              className={boq.is_client_visible ? buttonOutline : buttonPrimaryClassName}
            >
              {sharing
                ? 'Updating…'
                : boq.is_client_visible
                  ? 'Visible to client'
                  : 'Share BOQ with client'}
            </button>
          </div>
        }
      />

      <AppCard className="border-accent/20 bg-gradient-to-r from-primary/8 via-card to-accent/5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</p>
            <p className="mt-1 text-lg font-semibold">{clientName}</p>
            {client?.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
            {client?.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project / site</p>
            <p className="mt-1 text-lg font-semibold">{project?.title}</p>
            <p className="text-sm text-muted-foreground">{clientAddress}</p>
          </div>
        </div>
      </AppCard>

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionTotal = section.items.reduce((s, i) => s + Number(i.amount || 0), 0)
          return (
            <AppCard key={section.id} padding={false} className="overflow-hidden shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-primary/5 px-5 py-3">
                <input
                  key={`${section.id}-${section.title}`}
                  defaultValue={section.title}
                  onBlur={async (e) => {
                    setSaving(true)
                    await supabase.from('boq_sections').update({ title: e.target.value }).eq('id', section.id)
                    await loadBoq()
                    setSaving(false)
                  }}
                  className={`${inputClassName} max-w-xl bg-background font-semibold`}
                />
                <button type="button" onClick={() => addLineItem(section.id)} className={buttonOutline}>
                  <Plus className="mr-1 h-4 w-4" />
                  Line item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-2 py-2.5 w-24">Unit</th>
                      <th className="px-2 py-2.5 text-right w-28">Qty</th>
                      <th className="px-2 py-2.5 text-right w-28">Rate</th>
                      <th className="px-4 py-2.5 text-right w-28">Amount</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                        <td className="px-4 py-2">
                          <input
                            key={`${item.id}-desc-${item.description}`}
                            defaultValue={item.description}
                            onBlur={(e) => updateItem(item.id, 'description', e.target.value)}
                            className={cellInput}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            key={`${item.id}-unit-${item.unit}`}
                            defaultValue={item.unit}
                            onBlur={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className={cellInput}
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            key={`${item.id}-qty-${item.quantity}`}
                            defaultValue={item.quantity}
                            onBlur={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            key={`${item.id}-rate-${item.rate}`}
                            defaultValue={item.rate}
                            onBlur={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums">
                          {Number(item.amount).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-accent/10">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold">
                        Section total
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">{sectionTotal.toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </AppCard>
          )
        })}
      </div>

      <div className="flex justify-end">
        <AppCard className="min-w-[16rem] border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 text-right shadow-md">
          <p className="text-sm font-medium text-muted-foreground">Grand total</p>
          <p className="text-3xl font-bold tabular-nums">{grandTotal.toFixed(2)}</p>
        </AppCard>
      </div>
    </div>
  )
}

const cellInput = `${inputClassName} py-1.5 text-sm`
const buttonOutline =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-muted disabled:opacity-50'