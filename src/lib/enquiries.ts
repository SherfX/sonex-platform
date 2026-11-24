import { supabase } from './supabase'

export const ENQUIRY_STATUS = {
  new: 'New enquiry',
  project_created: 'Project created',
  boq_shared: 'BOQ shared',
} as const

export type EnquiryStatus = keyof typeof ENQUIRY_STATUS

export async function uploadEnquiryFile(
  submissionId: string,
  file: File,
  uploaderProfileId: string | null,
) {
  const path = `enquiries/${submissionId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const { error: uploadError } = await supabase.storage.from('client-documents').upload(path, file)
  if (uploadError) throw uploadError

  const { data: media, error: mediaError } = await supabase
    .from('media_assets')
    .insert({
      bucket: 'client-documents',
      path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: uploaderProfileId,
      is_public: false,
    })
    .select()
    .single()

  if (mediaError || !media) throw mediaError ?? new Error('Failed to save file record')

  const { error: linkError } = await supabase.from('submission_files').insert({
    submission_id: submissionId,
    media_asset_id: media.id,
  })
  if (linkError) throw linkError

  return media
}

export async function convertEnquiryToProject(
  submissionId: string,
  adminId: string,
): Promise<{ projectId: string } | { error: string }> {
  const { data: submission } = await supabase
    .from('project_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (!submission) return { error: 'Enquiry not found' }
  if (submission.project_id) return { error: 'Project already created for this enquiry' }

  let clientId: string | null = submission.submitted_by ?? null
  if (!clientId && submission.email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', submission.email)
      .maybeSingle()
    clientId = profile?.id ?? null
  }

  const title =
    submission.project_title?.trim() ||
    submission.company?.trim() ||
    `Project — ${submission.full_name || 'Client'}`

  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) + `-${Date.now().toString(36)}`

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      title,
      slug,
      description: submission.message,
      location: submission.location,
      client_id: clientId,
      status: 'active',
      created_by: adminId,
      completion_percentage: 0,
    })
    .select('id')
    .single()

  if (projectError || !project) return { error: projectError?.message || 'Could not create project' }

  await supabase
    .from('project_submissions')
    .update({ status: 'project_created', project_id: project.id })
    .eq('id', submissionId)

  if (clientId) {
    await supabase.from('project_assignments').upsert(
      {
        project_id: project.id,
        user_id: clientId,
        role_on_project: 'client',
      },
      { onConflict: 'project_id,user_id' },
    )
  }

  const { data: files } = await supabase
    .from('submission_files')
    .select('media_asset_id')
    .eq('submission_id', submissionId)

  for (const f of files || []) {
    await supabase.from('documents').insert({
      project_id: project.id,
      title: 'Enquiry attachment',
      media_asset_id: f.media_asset_id,
      uploaded_by: clientId ?? adminId,
      is_client_visible: true,
    })
  }

  return { projectId: project.id }
}

export async function markBoqSharedForProject(projectId: string) {
  await supabase
    .from('project_submissions')
    .update({ status: 'boq_shared' })
    .eq('project_id', projectId)
}