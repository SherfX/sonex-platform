import { supabase } from './supabase'

/** Profile id to use for FK columns — never returns auth uid unless a matching profiles row exists. */
export async function resolveSubmittedByProfileId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return null

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (profile?.id) return profile.id

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string | undefined) || '',
    role: 'client',
  })

  if (!insertError) return user.id

  const { data: retry } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  return retry?.id ?? null
}