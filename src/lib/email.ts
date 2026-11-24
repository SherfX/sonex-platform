import { supabase } from './supabase'

export type EnquiryEmailPayload = {
  full_name: string
  email: string
  phone?: string
  company?: string
  message: string
}

export async function notifyEnquiryByEmail(payload: EnquiryEmailPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('send-enquiry-email', {
    body: payload,
  })
  if (error) {
    console.warn('Enquiry email notification failed:', error.message)
  }
}