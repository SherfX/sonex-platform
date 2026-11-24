import { supabase } from './supabase'
import { NMOMYO_BOQ_TEMPLATE } from './boqTemplate'

export async function createBoqFromTemplate(
  projectId: string,
  createdBy: string | null | undefined,
  projectTitle: string | null | undefined,
) {
  const { data: doc, error } = await supabase
    .from('boq_documents')
    .insert({
      project_id: projectId,
      title: projectTitle ? `BOQ — ${projectTitle}` : 'BOQ — Superstructure to Completion (From Slab Level)',
      status: 'draft',
      is_client_visible: false,
      created_by: createdBy ?? null,
    })
    .select('id')
    .single()

  if (error || !doc) throw error ?? new Error('Could not create BOQ')

  for (let i = 0; i < NMOMYO_BOQ_TEMPLATE.length; i++) {
    const stage = NMOMYO_BOQ_TEMPLATE[i]
    const { data: section, error: sectionError } = await supabase
      .from('boq_sections')
      .insert({ boq_document_id: doc.id, title: stage.title, sort_order: i + 1 })
      .select('id')
      .single()

    if (sectionError || !section) continue

    await supabase.from('boq_items').insert(
      stage.items.map((item, sort) => ({
        section_id: section.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        sort_order: sort + 1,
      })),
    )
  }

  return doc.id
}

export async function syncBoqGrandTotal(boqDocumentId: string, grandTotal: number) {
  await supabase.from('boq_documents').update({ total_amount: grandTotal }).eq('id', boqDocumentId)
}